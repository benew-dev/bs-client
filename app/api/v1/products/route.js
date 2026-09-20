// app/api/v1/products/route.js

import { NextResponse } from "next/server";
import * as yup from "yup";
import dbConnect from "@/backend/config/dbConnect";
import Product from "@/backend/models/product";
import Category from "@/backend/models/category"; // Nécessaire pour populate("category")
import { captureException } from "@/monitoring/sentry";
import { withIntelligentRateLimit } from "@/utils/rateLimit";

/**
 * GET /api/v1/products
 * Version mobile : liste des produits avec filtres et pagination.
 * Route publique, aucune authentification requise.
 *
 * Paramètres acceptés (tous optionnels) :
 * - keyword       : recherche sur le nom (max 100 caractères)
 * - category      : ObjectId de la catégorie
 * - min | price[gt] : prix strictement supérieur à
 * - max | price[lt] : prix strictement inférieur à
 * - page          : numéro de page (1 à 1000, défaut 1)
 *
 * Réponse : { success, data: { totalPages, totalProducts, products } }
 *
 * Rate limit : api / publicRead (100 req/min par IP)
 */

// ===== CONFIGURATION =====
const toPositiveInt = (value, fallback) => {
  const n = parseInt(value, 10);
  return Number.isInteger(n) && n > 0 ? n : fallback;
};

const DEFAULT_PER_PAGE = toPositiveInt(
  process.env.DEFAULT_PRODUCTS_PER_PAGE,
  2,
);
const MAX_PER_PAGE = toPositiveInt(process.env.MAX_PRODUCTS_PER_PAGE, 5);
const RES_PER_PAGE = Math.min(MAX_PER_PAGE, DEFAULT_PER_PAGE);

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=600",
};

// ===== VALIDATION (Yup) =====
const productsQuerySchema = yup.object().shape({
  keyword: yup
    .string()
    .transform((value) =>
      typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value,
    )
    .max(100, "Maximum 100 caractères"),

  category: yup
    .string()
    .trim()
    .matches(/^[0-9a-fA-F]{24}$/, "ID catégorie invalide"),

  min: yup
    .number()
    .typeError("Prix minimum invalide")
    .min(0, "Prix minimum doit être >= 0")
    .max(999999, "Prix maximum dépassé"),

  max: yup
    .number()
    .typeError("Prix maximum invalide")
    .min(0, "Prix maximum doit être >= 0")
    .max(999999, "Prix maximum dépassé")
    .test("greater-than-min", "Doit être >= prix minimum", function (value) {
      const { min } = this.parent;
      return value === undefined || min === undefined || value >= min;
    }),

  page: yup
    .number()
    .typeError("Page invalide")
    .integer("Page doit être un entier")
    .min(1, "Page minimum 1")
    .max(1000, "Page maximum 1000")
    .default(1),
});

/**
 * Extrait les paramètres de l'URL. Les valeurs vides sont ignorées.
 * `min` et `max` acceptent aussi `price[gt]` et `price[lt]` (comme le web).
 */
const extractRawParams = (searchParams) => {
  const raw = {};

  const pick = (target, ...names) => {
    for (const name of names) {
      const value = searchParams.get(name);
      if (value !== null && value.trim() !== "") {
        raw[target] = value;
        return;
      }
    }
  };

  pick("keyword", "keyword");
  pick("category", "category");
  pick("min", "min", "price[gt]");
  pick("max", "max", "price[lt]");
  pick("page", "page");

  return raw;
};

const formatYupErrors = (error) => {
  const errors = {};
  if (error.inner?.length) {
    error.inner.forEach((err) => {
      if (err.path && !errors[err.path]) errors[err.path] = err.message;
    });
  } else {
    errors[error.path || "general"] = error.message;
  }
  return errors;
};

// Échappe les caractères spéciaux pour un usage littéral dans $regex
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ===== HANDLER =====
export const GET = withIntelligentRateLimit(
  async function (req) {
    // 1. Validation des paramètres
    let params;
    try {
      params = await productsQuerySchema.validate(
        extractRawParams(req.nextUrl.searchParams),
        { abortEarly: false, stripUnknown: true },
      );
    } catch (error) {
      if (error.name === "ValidationError") {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid parameters",
            errors: formatYupErrors(error),
          },
          { status: 400 },
        );
      }
      throw error;
    }

    try {
      await dbConnect();

      const { keyword, category, min, max, page } = params;

      // 2. Construction du filtre
      const filter = { isActive: true };

      if (keyword) {
        filter.name = { $regex: escapeRegex(keyword), $options: "i" };
      }

      if (category) {
        filter.category = category;
      }

      if (min !== undefined || max !== undefined) {
        filter.price = {};
        if (min !== undefined) filter.price.$gt = min; // strict, comme le web
        if (max !== undefined) filter.price.$lt = max; // strict, comme le web
      }

      const skip = (page - 1) * RES_PER_PAGE;

      // 3. Requêtes (comptage + liste) en parallèle
      const [totalProducts, products] = await Promise.all([
        Product.countDocuments(filter),
        Product.find(filter)
          .select("name description stock price images category")
          .slice("images", 1)
          .sort({ createdAt: -1, _id: -1 }) // ordre stable pour la pagination
          .skip(skip)
          .limit(RES_PER_PAGE)
          .populate("category", "categoryName")
          .lean(),
      ]);

      return NextResponse.json(
        {
          success: true,
          data: {
            totalPages: Math.ceil(totalProducts / RES_PER_PAGE),
            totalProducts,
            products: products || [],
          },
        },
        { status: 200, headers: CACHE_HEADERS },
      );
    } catch (error) {
      console.error("[v1/products] GET error:", error.message);

      captureException(error, {
        tags: { component: "api", route: "v1/products/GET" },
        extra: { query: req.nextUrl.search },
      });

      let status = 500;
      let message = "Failed to fetch products";

      if (error.message?.includes("Circuit breaker OPEN")) {
        status = 503;
        message = "Service temporarily unavailable";
      } else if (error.message?.includes("timeout")) {
        status = 504;
        message = "Request timeout";
      }

      return NextResponse.json({ success: false, message }, { status });
    }
  },
  {
    category: "api",
    action: "publicRead",
  },
);

import { NextResponse } from "next/server";
import dbConnect from "@/backend/config/dbConnect";
import User from "@/backend/models/user";
import { validateRegister } from "@/helpers/validation/schemas/auth";
import { captureException } from "@/monitoring/sentry";
import { withAuthRateLimit } from "@/utils/rateLimit";

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur avec vérification email et sécurité renforcée
 * Rate limit: Configuration intelligente personnalisée (5 inscriptions par heure, strict)
 *
 * Headers de sécurité gérés par next.config.mjs pour /api/auth/* :
 * - Cache-Control: no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0
 * - Pragma: no-cache
 * - Expires: 0
 * - Surrogate-Control: no-store
 * - X-Content-Type-Options: nosniff
 * - X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
 * - X-Download-Options: noopen
 *
 * Headers globaux de sécurité (appliqués à toutes les routes) :
 * - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 * - X-Frame-Options: SAMEORIGIN
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: [configuration restrictive]
 * - Content-Security-Policy: [configuration complète avec unsafe-inline pour auth]
 */
export const POST = withAuthRateLimit(
  async function (req) {
    try {
      // Connexion DB
      await dbConnect();

      // Parser les données avec gestion d'erreur
      let userData;
      try {
        userData = await req.json();
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            message: "Corps de requête invalide",
            code: "INVALID_REQUEST_BODY",
          },
          { status: 400 },
        );
      }

      // Validation des données avec Yup
      const validation = await validateRegister({
        name: userData.name?.trim(),
        email: userData.email?.toLowerCase()?.trim(),
        phone: userData.phone?.trim(),
        password: userData.password,
      });

      if (!validation.isValid) {
        return NextResponse.json(
          {
            success: false,
            message: "Données invalides",
            errors: validation.errors,
            code: "VALIDATION_FAILED",
          },
          { status: 400 },
        );
      }

      // Vérification d'unicité email
      const existingUser = await User.findOne({
        $or: [{ email: validation.data.email }],
      });

      if (existingUser) {
        console.log(
          `Registration attempt with existing email:`,
          validation.data.email,
        );

        return NextResponse.json(
          {
            success: false,
            message: `Ce email est déjà utilisé`,
            code: "DUPLICATE_EMAIL",
          },
          { status: 400 },
        );
      }

      // Créer l'utilisateur avec tous les champs appropriés
      const user = await User.create({
        name: validation.data.name,
        email: validation.data.email,
        phone: validation.data.phone,
        password: validation.data.password,
        role: "user",
        isActive: true,
        avatar: {
          public_id: null,
          url: null,
        },
      });

      console.log("✅ User registered successfully:", {
        id: user._id,
        email: user.email,
        name: user.name,
      });

      // Réponse enrichie avec informations complètes
      const response = {
        success: true,
        message: "Inscription réussie !",
        data: {
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            avatar: user.avatar,
          },
        },
      };

      return NextResponse.json(response, { status: 201 });
    } catch (error) {
      console.error("❌ Registration error:", error.message);

      // Gestion spécifique des erreurs MongoDB
      if (error.code === 11000) {
        // Erreur d'index unique
        const duplicateField = Object.keys(error.keyPattern)[0];
        return NextResponse.json(
          {
            success: false,
            message: `Ce ${duplicateField === "email" ? "email" : "téléphone"} est déjà utilisé`,
            code: "DUPLICATE_" + duplicateField.toUpperCase(),
          },
          { status: 400 },
        );
      }

      // Gestion des erreurs de validation Mongoose
      if (error.name === "ValidationError") {
        const validationErrors = {};
        Object.keys(error.errors).forEach((key) => {
          validationErrors[key] = error.errors[key].message;
        });

        return NextResponse.json(
          {
            success: false,
            message: "Erreurs de validation",
            errors: validationErrors,
            code: "MODEL_VALIDATION_ERROR",
          },
          { status: 400 },
        );
      }

      // Gestion des erreurs de connexion DB
      if (error.message.includes("connection")) {
        captureException(error, {
          tags: { component: "database", route: "auth/register" },
          level: "error",
        });

        return NextResponse.json(
          {
            success: false,
            message: "Erreur de connexion. Veuillez réessayer.",
            code: "DATABASE_CONNECTION_ERROR",
          },
          { status: 503 }, // Service Unavailable
        );
      }

      // Capturer toutes les autres erreurs système
      captureException(error, {
        tags: { component: "api", route: "auth/register" },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Erreur lors de l'inscription. Veuillez réessayer.",
          code: "INTERNAL_SERVER_ERROR",
        },
        { status: 500 },
      );
    }
  },
  {
    action: "loginSuccess", // Utiliser loginSuccess car l'inscription donne accès
    // customStrategy optionnelle si vous voulez garder 5/heure au lieu de 30/minute
    customStrategy: {
      points: 5, // 5 inscriptions maximum
      duration: 3600000, // par heure
      blockDuration: 3600000, // blocage 1h
      keyStrategy: "ip+email", // Track IP + email pour éviter abus
      requireAuth: false,
    },
  },
);

import { NextResponse } from "next/server";
import dbConnect from "@/backend/config/dbConnect";
import PaymentType from "@/backend/models/paymentType";
import { captureException } from "@/monitoring/sentry";
import { withApiRateLimit } from "@/utils/rateLimit";

/**
 * GET /api/payment-platforms
 * Récupère toutes les plateformes de paiement disponibles
 * Rate limit: 60 req/min (public) ou 120 req/min (authenticated)
 *
 * Headers de sécurité gérés par next.config.mjs pour /api/payment-platforms/* :
 * - Cache-Control: public, max-age=300, stale-while-revalidate=600
 * - CDN-Cache-Control: max-age=600
 * - X-Content-Type-Options: nosniff
 * - Vary: Accept-Encoding
 *
 * Headers globaux de sécurité (toutes routes) :
 * - Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
 * - X-Frame-Options: SAMEORIGIN
 * - Referrer-Policy: strict-origin-when-cross-origin
 * - Permissions-Policy: [configuration restrictive]
 * - Content-Security-Policy: [configuration complète]
 *
 * Note: Les plateformes de paiement sont des données publiques avec cache long
 * car elles changent rarement dans un e-commerce
 */
export const GET = withApiRateLimit(async function () {
  try {
    // Connexion DB
    await dbConnect();

    // Récupérer toutes les plateformes de paiement
    const paymentPlatforms = await PaymentType.find()
      .sort({ paymentName: 1 })
      .lean();

    // Vérifier s'il y a des plateformes
    if (!paymentPlatforms || paymentPlatforms.length === 0) {
      return NextResponse.json(
        {
          success: true,
          message: "No payment platforms available",
          data: {
            platforms: [],
            count: 0,
            meta: {
              timestamp: new Date().toISOString(),
              cached: false,
            },
          },
        },
        {
          status: 200,
          // Pas de headers manuels - gérés par next.config.mjs
        },
      );
    }

    // Formater les plateformes pour optimiser la réponse
    const formattedPaymentPlatforms = paymentPlatforms.map((payment) => ({
      _id: payment._id,
      name: payment.paymentName,
      number: payment.paymentNumber,
    }));

    // ============================================
    // NOUVELLE IMPLÉMENTATION : Headers de sécurité
    //
    // Les headers sont maintenant gérés de manière centralisée
    // par next.config.mjs pour garantir la cohérence et la sécurité
    //
    // Pour /api/payment-platforms/* sont appliqués automatiquement :
    // - Cache public avec max-age de 5 minutes (données publiques)
    // - Stale-while-revalidate de 10 minutes pour fraîcheur
    // - CDN cache de 10 minutes pour performance
    // - Protection MIME sniffing (X-Content-Type-Options)
    // - Vary sur Accept-Encoding pour compression
    //
    // Ces headers optimisent la performance pour les données
    // publiques tout en maintenant la fraîcheur des données
    // ============================================

    // Calculer un hash simple pour l'ETag (optionnel)
    const dataHash = Buffer.from(JSON.stringify(formattedPaymentPlatforms))
      .toString("base64")
      .substring(0, 20);

    return NextResponse.json(
      {
        success: true,
        data: {
          platforms: formattedPaymentPlatforms,
          count: formattedPaymentPlatforms.length,
          meta: {
            timestamp: new Date().toISOString(),
            etag: dataHash,
            cached: true,
            cacheMaxAge: 300, // Informer le client du cache
          },
        },
      },
      {
        status: 200,
        // Headers de cache gérés automatiquement par next.config.mjs
        // Configuration dans next.config.mjs :
        // source: '/api/payment-platforms/:path*'
        // Cache-Control: public, max-age=300, stale-while-revalidate=600
      },
    );
  } catch (error) {
    console.error("Payment platforms fetch error:", error.message);

    // Capturer seulement les vraies erreurs système
    captureException(error, {
      tags: {
        component: "api",
        route: "payment-platforms/GET",
        error_type: error.name,
      },
      extra: {
        message: error.message,
        stack: error.stack,
      },
    });

    // Gestion améliorée des erreurs
    let status = 500;
    let message = "Failed to fetch payment platforms";
    let code = "INTERNAL_ERROR";

    if (
      error.name === "MongoNetworkError" ||
      error.message?.includes("connection")
    ) {
      status = 503;
      message = "Database connection error";
      code = "DB_CONNECTION_ERROR";
    } else if (error.message?.includes("timeout")) {
      status = 504;
      message = "Request timeout";
      code = "TIMEOUT";
    }

    return NextResponse.json(
      {
        success: false,
        message,
        code,
        ...(process.env.NODE_ENV === "development" && {
          error: error.message,
        }),
      },
      { status },
    );
  }
});

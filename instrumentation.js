// instrumentation.js
// Configuration d'instrumentation Next.js 15 - buyitnow-client-n15-prv1
// Import conditionnel de Sentry selon l'environnement

import { EventEmitter } from "events";

// Augmenter la limite d'écouteurs pour éviter les warnings
EventEmitter.defaultMaxListeners = 20;

/**
 * Hook Next.js 15 - Initialisation de l'instrumentation
 * Charge Sentry serveur uniquement en environnement Node.js
 */
export async function register() {
  // Import conditionnel selon l'environnement
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("🔧 Loading Sentry server configuration...");

    try {
      // Import dynamique de la configuration serveur
      await import("./sentry.server.config.js");
      console.log("✅ Sentry server configuration loaded");
    } catch (error) {
      console.error(
        "❌ Failed to load Sentry server configuration:",
        error.message,
      );
    }
  }
  // Import conditionnel selon l'environnement
  if (process.env.NEXT_RUNTIME === "edge") {
    console.log("🔧 Loading Sentry server configuration...");

    try {
      // Import dynamique de la configuration serveur
      console.log("🔧 Loading Sentry edge configuration...");
      await import("./sentry.edge.config.js");
      console.log("✅ Sentry edge configuration loaded");
    } catch (error) {
      console.error(
        "❌ Failed to load Sentry edge configuration:",
        error.message,
      );
    }
  }

  console.log("✅ Next.js instrumentation registered");
}

/**
 * Hook Next.js 15 - Capture des erreurs de requête serveur
 * Utilise le hook officiel Sentry pour Next.js
 */
export async function onRequestError(error, request, context) {
  try {
    // Import dynamique de Sentry pour éviter les erreurs côté client
    const { captureException, setContext, setTag } = await import(
      "@sentry/nextjs"
    );

    // Ajouter le contexte de la requête (données non-sensibles uniquement)
    setContext("request", {
      url: request.url,
      method: request.method,
      userAgent: request.headers?.get?.("user-agent") || "unknown",
      contentType: request.headers?.get?.("content-type") || "unknown",
    });

    // Ajouter des tags pour la catégorisation
    setTag("error_source", "server_request");
    setTag("request_method", request.method);

    // Catégoriser selon la route
    if (request.url) {
      if (request.url.includes("/api/")) {
        setTag("route_type", "api");
      } else {
        setTag("route_type", "page");
      }
    }

    // Capturer l'erreur
    captureException(error, {
      tags: {
        component: "server_request",
        project: "buyitnow-client-n15-prv1",
      },
    });
  } catch (sentryError) {
    // Fallback si Sentry échoue
    console.error("❌ Error in onRequestError hook:", sentryError.message);
    console.error("📍 Original error:", error.message);
  }
}

// instrumentation.js
// Configuration d'instrumentation Next.js 15 - buyitnow-client-n15-prv1
// Import conditionnel de Sentry selon l'environnement

import * as Sentry from "@sentry/nextjs";
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
export const onRequestError = Sentry.captureRequestError;

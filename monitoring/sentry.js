// monitoring/sentry.js - Utilitaire de capture (PAS d'initialisation)
import * as Sentry from "@sentry/nextjs";

/**
 * ⚠️ IMPORTANT : Ce fichier N'INITIALISE PAS Sentry !
 *
 * L'initialisation se fait automatiquement par Next.js via :
 * - instrumentation-client.js (client/navigateur)
 * - sentry.server.config.js (serveur Node.js)
 * - sentry.edge.config.js (edge runtime)
 *
 * Ce fichier fournit uniquement des fonctions utilitaires
 * qui utilisent Sentry DÉJÀ initialisé.
 */

/**
 * Capture une erreur client avec contexte et sampling
 * @param {Error} error - L'erreur à capturer
 * @param {string} component - Nom du composant
 * @param {string} action - Action qui a causé l'erreur
 * @param {boolean} isCritical - Si l'erreur est critique
 */
export const captureClientError = (
  error,
  component,
  action,
  isCritical = false,
) => {
  // Vérifier que Sentry est initialisé
  if (!Sentry.getCurrentScope()) {
    console.error("Sentry not initialized:", error);
    return;
  }

  // Ne capturer que si on est côté client
  if (typeof window === "undefined") return;

  // Sampling pour les erreurs non-critiques (30%)
  if (!isCritical && Math.random() > 0.3) return;

  Sentry.captureException(error, {
    tags: {
      component,
      action,
      critical: isCritical,
      client_side: true,
    },
    fingerprint: [component, action, error.name],
  });
};

/**
 * Capture une exception avec contexte personnalisé
 * Fonctionne côté client, serveur et edge
 * @param {Error} error - L'erreur à capturer
 * @param {Object} context - Contexte supplémentaire
 */
export const captureException = (error, context = {}) => {
  if (!Sentry.getCurrentScope()) {
    console.error("Sentry not initialized:", error);
    return;
  }

  Sentry.withScope((scope) => {
    // Tags
    Object.entries(context.tags || {}).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    // Extra data
    Object.entries(context.extra || {}).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    // Niveau
    if (context.level) {
      scope.setLevel(context.level);
    }

    // Fingerprint pour grouper les erreurs similaires
    if (context.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    Sentry.captureException(error);
  });
};

/**
 * Capture un message (log) avec contexte
 * @param {string} message - Le message à capturer
 * @param {Object} context - Contexte supplémentaire
 */
export const captureMessage = (message, context = {}) => {
  if (!Sentry.getCurrentScope()) {
    console.warn("Sentry not initialized:", message);
    return;
  }

  Sentry.withScope((scope) => {
    Object.entries(context.tags || {}).forEach(([key, value]) => {
      scope.setTag(key, value);
    });

    Object.entries(context.extra || {}).forEach(([key, value]) => {
      scope.setExtra(key, value);
    });

    if (context.level) {
      scope.setLevel(context.level);
    }

    Sentry.captureMessage(message, context.level || "info");
  });
};

/**
 * Définit l'utilisateur actuel pour le tracking
 * @param {Object} user - Informations utilisateur
 */
export const setUser = (user) => {
  if (!Sentry.getCurrentScope()) {
    return;
  }

  if (!user) {
    Sentry.setUser(null);
    return;
  }

  // Anonymisation pour la confidentialité
  Sentry.setUser({
    id: user.id || user._id,
    email: user.email ? `${hashCode(user.email)}@anonymized.user` : undefined,
    role: user.role || "user",
  });
};

/**
 * Hachage simple pour anonymiser les emails
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Export par défaut pour compatibilité
export default {
  captureClientError,
  captureException,
  captureMessage,
  setUser,
};

// sentry.edge.config.js
// Configuration Sentry Edge Runtime - Erreurs uniquement
// Next.js 15 - buyitnow-client-n15-prv1
// Utilisé par : Middleware, Edge Functions, Edge API Routes

import * as Sentry from "@sentry/nextjs";

// Configuration d'environnement
const environment = process.env.NODE_ENV || "development";
const isProd = environment === "production";

// Fonction simple pour détecter les données sensibles
const containsSensitiveData = (str) => {
  if (!str || typeof str !== "string") return false;

  const sensitivePatterns = [
    /password/i,
    /token/i,
    /auth/i,
    /key/i,
    /secret/i,
    /waafi|cac-pay|bci-pay|d-money/i,
    /session/i,
    /cookie/i,
    /email[=:]/i,
    /user[=:]/i,
  ];

  return sensitivePatterns.some((pattern) => pattern.test(str));
};

// Classification simple des erreurs
const categorizeError = (error) => {
  if (!error) return "unknown";

  const message = (error.message || "").toLowerCase();
  const name = (error.name || "").toLowerCase();
  const combined = message + " " + name;

  if (/auth|permission|unauthorized|forbidden|session/.test(combined))
    return "authentication";
  if (/network|fetch|http|request|api/.test(combined)) return "network";
  if (/validation|schema|required|invalid/.test(combined)) return "validation";
  if (/middleware|route|redirect/.test(combined)) return "routing";
  if (/timeout|abort/.test(combined)) return "timeout";

  return "application";
};

// Validation DSN simple
const isValidDSN = (dsn) => {
  return dsn && /^https:\/\/[^@]+@[^/]+\/\d+$/.test(dsn);
};

const sentryDSN = process.env.SENTRY_DSN;

if (isValidDSN(sentryDSN)) {
  Sentry.init({
    dsn: sentryDSN,
    environment,
    release: process.env.NEXT_PUBLIC_VERSION || "0.1.0",

    // Configuration Edge - Erreurs uniquement
    debug: !isProd,
    enabled: true,

    tracesSampleRate: 0, // Désactive explicitement le tracing

    // Traitement des breadcrumbs
    beforeBreadcrumb(breadcrumb) {
      // Filtrer les requêtes vers des routes sensibles
      if (
        ["xhr", "fetch"].includes(breadcrumb.category) &&
        breadcrumb.data?.url
      ) {
        const url = breadcrumb.data.url;

        // Ignorer les routes sensibles
        if (/\/(api\/)?(auth|login|payment|confirmation)/.test(url)) {
          return null;
        }

        // Filtrer les données dans le body des requêtes
        if (
          breadcrumb.data.body &&
          containsSensitiveData(breadcrumb.data.body)
        ) {
          breadcrumb.data.body = "[FILTERED]";
        }
      }

      // Filtrer les logs console sensibles
      if (breadcrumb.category === "console" && breadcrumb.message) {
        if (containsSensitiveData(breadcrumb.message)) {
          return null;
        }
      }

      return breadcrumb;
    },

    // Traitement des événements avant envoi
    beforeSend(event, hint) {
      const error = hint && hint.originalException;

      // Ignorer les erreurs des routes sensibles
      if (event.request?.url) {
        const url = event.request.url;
        if (/\/(api\/)?(auth|login|payment|confirmation)/.test(url)) {
          return null;
        }
      }

      // Catégoriser l'erreur
      if (error) {
        event.tags = event.tags || {};
        event.tags.error_category = categorizeError(error);

        // Ajouter des tags spécifiques Edge
        event.tags.runtime_edge = true;
        event.tags.edge_location = "auto"; // Vercel Edge détermine automatiquement
      }

      // Anonymiser les headers
      if (event.request?.headers) {
        const sensitiveHeaders = [
          "cookie",
          "authorization",
          "x-auth-token",
          "session",
          "set-cookie",
          "x-forwarded-for", // Anonymiser l'IP
        ];
        sensitiveHeaders.forEach((header) => {
          if (event.request.headers[header]) {
            event.request.headers[header] = "[FILTERED]";
          }
        });
      }

      // Anonymiser les cookies dans l'URL
      if (event.request?.cookies) {
        event.request.cookies = "[FILTERED]";
      }

      // Anonymiser les données utilisateur
      if (event.user) {
        delete event.user.ip_address;
        if (event.user.email) {
          event.user.email = "[FILTERED]";
        }
        if (event.user.username) {
          event.user.username = "[FILTERED]";
        }
      }

      // Filtrer les messages sensibles
      if (event.message && containsSensitiveData(event.message)) {
        event.message = "[Message filtré contenant des données sensibles]";
      }

      // Filtrer les query params sensibles
      if (event.request?.query_string) {
        const queryString = event.request.query_string;
        if (containsSensitiveData(queryString)) {
          event.request.query_string = "[FILTERED]";
        }
      }

      // Tags du projet
      event.tags = {
        ...event.tags,
        project: "bs-client",
        runtime: "edge",
      };

      return event;
    },

    // Erreurs à ignorer (spécifiques Edge + générales)
    ignoreErrors: [
      // Erreurs réseau
      "Connection refused",
      "Connection reset",
      "ECONNREFUSED",
      "ECONNRESET",
      "socket hang up",
      "ETIMEDOUT",
      "read ECONNRESET",
      "connect ETIMEDOUT",

      // Erreurs de parsing
      "Unexpected token",
      "SyntaxError",
      "JSON.parse",

      // Erreurs de certificat
      "DEPTH_ZERO_SELF_SIGNED_CERT",
      "CERT_HAS_EXPIRED",
      "ssl3_get_server_certificate",

      // Erreurs de DNS
      "getaddrinfo ENOTFOUND",
      "getaddrinfo EAI_AGAIN",

      // Erreurs Next.js
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
      "Cancelled",
      "Route cancelled",

      // Erreurs d'opérations abandonnées
      "AbortError",
      "Operation was aborted",
      "The operation was aborted",

      // Erreurs de middleware courantes (non-critiques)
      "MIDDLEWARE_NO_RESPONSE",
      "Edge function timeout",
      "Request timeout",

      // Erreurs de session NextAuth
      "Session token not found",
      "Invalid session token",
      "JWT expired",

      // Erreurs de redirection (attendues)
      "redirect",
      "Redirect",
      "MOVED_PERMANENTLY",
      "FOUND",
    ],
  });

  console.log("✅ Sentry Edge initialized (errors only)");
} else {
  console.warn("⚠️ Sentry Edge: Invalid or missing DSN");
}

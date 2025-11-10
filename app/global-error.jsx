// app/global-error.jsx
"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";

/**
 * Composant Global Error Handler pour Next.js 15 App Router
 * Capture toutes les erreurs non gérées de l'application
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte
    Sentry.captureException(error, {
      tags: {
        error_boundary: "global",
        component: "global-error",
        project: "buyitnow-client-n15-prv1",
        critical: true,
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
      },
      level: "fatal", // Erreur fatale car elle remonte jusqu'ici
    });

    // Log pour le débogage (sera supprimé en prod par votre config)
    console.error("Global Error Boundary caught error:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Une erreur est survenue - BuyItNow</title>
      </head>
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "2rem",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            backgroundColor: "#f9fafb",
            color: "#1f2937",
          }}
        >
          {/* Icon d'erreur */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              backgroundColor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          {/* Titre */}
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              textAlign: "center",
              color: "#dc2626",
            }}
          >
            Oups ! Une erreur est survenue
          </h1>

          {/* Message */}
          <p
            style={{
              fontSize: "1rem",
              color: "#6b7280",
              marginBottom: "2rem",
              textAlign: "center",
              maxWidth: "500px",
              lineHeight: "1.5",
            }}
          >
            Nous sommes désolés, mais quelque chose s&apos;est mal passé. Notre
            équipe a été notifiée et travaille pour résoudre le problème.
          </p>

          {/* Boutons d'action */}
          <div
            style={{
              display: "flex",
              gap: "1rem",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Bouton Réessayer */}
            <button
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "#2563eb",
                color: "white",
                border: "none",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#1d4ed8")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#2563eb")
              }
            >
              Réessayer
            </button>

            {/* Bouton Retour à l'accueil */}
            <a
              href="/"
              style={{
                padding: "0.75rem 1.5rem",
                backgroundColor: "white",
                color: "#2563eb",
                border: "2px solid #2563eb",
                borderRadius: "0.5rem",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                textDecoration: "none",
                display: "inline-block",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#eff6ff";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "white";
              }}
            >
              Retour à l&apos;accueil
            </a>
          </div>

          {/* Information de débogage (uniquement en développement) */}
          {process.env.NODE_ENV === "development" && (
            <details
              style={{
                marginTop: "2rem",
                padding: "1rem",
                backgroundColor: "#fee2e2",
                borderRadius: "0.5rem",
                maxWidth: "600px",
                width: "100%",
              }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  fontWeight: "600",
                  color: "#dc2626",
                  marginBottom: "0.5rem",
                }}
              >
                Détails de l&apos;erreur (développement uniquement)
              </summary>
              <pre
                style={{
                  fontSize: "0.875rem",
                  overflow: "auto",
                  padding: "1rem",
                  backgroundColor: "#fef2f2",
                  borderRadius: "0.25rem",
                  color: "#991b1b",
                }}
              >
                <code>
                  {error.name}: {error.message}
                  {error.digest && `\nDigest: ${error.digest}`}
                </code>
              </pre>
            </details>
          )}

          {/* Footer */}
          <p
            style={{
              marginTop: "2rem",
              fontSize: "0.875rem",
              color: "#9ca3af",
              textAlign: "center",
            }}
          >
            Si le problème persiste, veuillez{" "}
            <a
              href="/contact"
              style={{
                color: "#2563eb",
                textDecoration: "underline",
              }}
            >
              nous contacter
            </a>
            .
          </p>
        </div>

        {/* 
          NextError est utilisé pour la compatibilité avec le système d'erreurs de Next.js
          mais il est masqué car nous affichons notre propre UI
        */}
        <div style={{ display: "none" }}>
          <NextError statusCode={0} />
        </div>
      </body>
    </html>
  );
}

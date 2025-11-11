// app/login/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogIn, Home, RefreshCw, AlertCircle, UserX } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /login
 * Capture toutes les erreurs non gérées de la page de connexion
 *
 * Contexte spécifique:
 * - Erreur lors du chargement/affichage de la page de connexion
 * - Point d'entrée critique pour l'authentification
 * - Erreur empêche l'accès au formulaire de connexion
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function LoginError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "login",
        component: "login-error",
        page: "/login",
        critical: true, // Critique car empêche l'authentification
        business_impact: "high", // Impact élevé sur l'accès utilisateur
      },
      contexts: {
        authentication: {
          description: "Erreur lors de l'affichage de la page de connexion",
          userAction: "Tentative d'accès à la page de connexion",
          impact:
            "L'utilisateur ne peut pas accéder au formulaire de connexion",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    // Log pour le débogage local (sera supprimé en prod par next.config)
    console.error("Login Error Boundary caught error:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  const handleRetry = () => {
    reset(); // Efface l'erreur
    router.refresh(); // Force un re-fetch des données serveur
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Icône d'erreur avec login */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <LogIn className="text-red-600" size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <AlertCircle className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Erreur lors du chargement de la page de connexion
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors du
          chargement de la page de connexion. Notre équipe a été automatiquement
          notifiée et travaille pour résoudre ce problème.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-3">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw size={20} />
            <span>Réessayer</span>
          </button>

          {/* Bouton Créer un compte */}
          <Link
            href="/register"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <UserX size={20} />
            <span>Créer un compte</span>
          </Link>

          {/* Bouton Retour à l'accueil */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home size={20} />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* Suggestions supplémentaires */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">
            Que puis-je faire ?
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vérifiez votre connexion Internet</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Essayez de rafraîchir la page</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Videz le cache de votre navigateur</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Si le problème persiste, créez un nouveau compte</span>
            </li>
          </ul>
        </div>

        {/* Informations de débogage (développement uniquement) */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
            <summary className="cursor-pointer font-semibold text-red-900 mb-2 text-sm">
              Détails de l&apos;erreur (développement uniquement)
            </summary>
            <div className="mt-2 space-y-2">
              <div className="text-xs">
                <span className="font-medium text-red-900">Type:</span>{" "}
                <span className="text-red-700">{error.name}</span>
              </div>
              <div className="text-xs">
                <span className="font-medium text-red-900">Message:</span>{" "}
                <span className="text-red-700">{error.message}</span>
              </div>
              {error.digest && (
                <div className="text-xs">
                  <span className="font-medium text-red-900">Digest:</span>{" "}
                  <span className="text-red-700">{error.digest}</span>
                </div>
              )}
              {error.stack && (
                <div className="mt-2">
                  <div className="font-medium text-red-900 text-xs mb-1">
                    Stack Trace:
                  </div>
                  <pre className="text-xs overflow-auto p-2 bg-red-100 rounded text-red-800 max-h-40">
                    {error.stack}
                  </pre>
                </div>
              )}
            </div>
          </details>
        )}

        {/* Contact support */}
        <p className="mt-6 text-center text-sm text-gray-500">
          Le problème persiste ?{" "}
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Contactez notre support
          </Link>
        </p>
      </div>
    </div>
  );
}

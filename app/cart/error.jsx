// app/cart/error.jsx
"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingCart, Home, RefreshCw, X } from "lucide-react";
import * as Sentry from "@sentry/nextjs";
import { useRouter } from "next/navigation";

/**
 * Composant Error Boundary pour la route /cart
 * Capture toutes les erreurs non gérées de la page panier
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function CartError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "cart",
        component: "cart-error",
        page: "/cart",
        critical: true, // Erreur critique car empêche l'accès au panier
      },
      contexts: {
        cart: {
          description: "Erreur lors de l'accès à la page du panier",
          userAction: "Tentative d'accès au panier",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
      },
      level: "error",
    });

    // Log pour le débogage local (sera supprimé en prod par next.config)
    console.error("Cart Error Boundary caught error:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const handleRetry = () => {
    reset(); // Efface l'erreur
    router.refresh(); // Force un re-fetch des données serveur
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Icône d'erreur avec panier */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <ShoppingCart
                className="text-red-600"
                size={48}
                strokeWidth={1.5}
              />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <X className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Erreur lors de l&apos;accès au panier
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors de
          l&apos;accès à votre panier. Notre équipe a été automatiquement
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

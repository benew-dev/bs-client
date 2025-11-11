// app/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart,
  Home,
  RefreshCw,
  AlertCircle,
  Package,
  Search,
  Filter,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la page d'accueil (/)
 * Capture toutes les erreurs non gérées lors de l'affichage de la liste des produits
 *
 * Contexte spécifique:
 * - Erreur lors du chargement/affichage de la liste des produits
 * - Page publique accessible à tous les utilisateurs
 * - Fonctionnalité critique pour la vitrine e-commerce
 * - Erreur empêche l'utilisateur de voir les produits disponibles
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function HomePageError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "homepage",
        component: "homepage-error",
        page: "/",
        critical: true, // Critique car page principale du site
        business_impact: "critical", // Impact critique sur le business
        user_area: "public",
        feature: "product_listing",
      },
      contexts: {
        product_listing: {
          description:
            "Erreur lors de l'affichage de la liste des produits sur la page d'accueil",
          userAction: "Tentative de consultation des produits",
          impact: "L'utilisateur ne peut pas voir les produits disponibles",
          authenticated: false,
          pageType: "homepage",
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
    console.error("Homepage Error Boundary caught error:", {
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
              <AlertCircle className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Impossible de charger les produits
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors du
          chargement de notre catalogue de produits. Notre équipe a été
          automatiquement notifiée et travaille pour résoudre ce problème.
        </p>

        {/* Message rassurant */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Nos produits sont toujours disponibles
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                Notre catalogue est intact. Seul l&apos;affichage rencontre un
                problème technique temporaire. Réessayez dans quelques instants.
              </p>
            </div>
          </div>
        </div>

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

          {/* Bouton Rafraîchir la page */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <Home size={20} />
            <span>Accueil</span>
          </Link>
        </div>

        {/* Suggestions d'actions alternatives */}
        <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-3 text-sm flex items-center gap-2">
            <Search size={16} className="text-purple-600" />
            Que puis-je faire en attendant ?
          </h3>
          <div className="space-y-2">
            <Link
              href="/products?category=all"
              className="block text-sm text-purple-800 hover:text-purple-900 hover:underline transition-colors"
            >
              → Essayer de voir tous les produits
            </Link>
            <Link
              href="/products?keyword="
              className="block text-sm text-purple-800 hover:text-purple-900 hover:underline transition-colors"
            >
              → Faire une recherche spécifique
            </Link>
            <Link
              href="/contact"
              className="block text-sm text-purple-800 hover:text-purple-900 hover:underline transition-colors"
            >
              → Contacter le service client
            </Link>
          </div>
        </div>

        {/* Suggestions techniques */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-2">
            <Filter size={16} className="text-amber-600" />
            Solutions techniques
          </h3>
          <ul className="text-sm text-amber-800 space-y-1.5">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Vérifiez votre connexion Internet</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Videz le cache de votre navigateur</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Essayez dans un autre navigateur</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>
                Désactivez les extensions de navigateur temporairement
              </span>
            </li>
          </ul>
        </div>

        {/* Information pour les visiteurs fréquents */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            Problème récurrent ?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Si ce problème se reproduit fréquemment, notre équipe technique
            aimerait en être informée pour améliorer votre expérience.
          </p>
          <Link
            href="/contact?subject=probleme-technique"
            className="text-sm text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Signaler un problème récurrent
          </Link>
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
          Besoin d&apos;aide immédiate ?{" "}
          <Link
            href="/contact"
            className="text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Contactez notre équipe
          </Link>
        </p>
      </div>
    </div>
  );
}

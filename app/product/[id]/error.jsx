// app/product/[id]/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package,
  RefreshCw,
  Search,
  AlertCircle,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /product/[id]
 * Capture toutes les erreurs non gérées de la page de détails produit
 *
 * Contexte spécifique:
 * - Erreur lors du chargement/affichage d'un produit spécifique
 * - Page critique du tunnel de conversion (découverte → achat)
 * - Erreur empêche la consultation des détails du produit
 * - Impact direct sur les ventes
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function ProductError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Extraire l'ID du produit depuis l'URL pour le contexte
    const getProductIdFromUrl = () => {
      if (typeof window === "undefined") return null;
      const segments = window.location.pathname.split("/");
      return segments[segments.length - 1] || null;
    };

    const productId = getProductIdFromUrl();

    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "product-detail",
        component: "product-error",
        page: "/product/[id]",
        critical: true, // Critique car empêche la vente
        business_impact: "high", // Impact élevé sur les revenus
        conversion_funnel: "product_view", // Étape du tunnel de conversion
      },
      contexts: {
        product: {
          description:
            "Erreur lors de l'affichage de la page de détails produit",
          userAction: "Tentative de consultation d'un produit",
          impact:
            "L'utilisateur ne peut pas voir les détails du produit pour l'acheter",
          productId: productId || "unknown",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        productId: productId,
        url: typeof window !== "undefined" ? window.location.href : null,
        referrer: typeof window !== "undefined" ? document.referrer : null,
        timestamp: new Date().toISOString(),
      },
      level: "error",
    });

    // Log pour le débogage local (sera supprimé en prod par next.config)
    console.error("Product Error Boundary caught error:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      productId: productId,
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
      <div className="max-w-2xl w-full">
        {/* Icône d'erreur avec package */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <Package className="text-red-600" size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <AlertCircle className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Impossible d&apos;afficher ce produit
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors du
          chargement de la page de ce produit. Notre équipe a été
          automatiquement notifiée et travaille pour résoudre ce problème.
        </p>

        {/* Causes possibles */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-2 text-sm">
            Causes possibles :
          </h3>
          <ul className="text-sm text-blue-800 space-y-1.5">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Le produit a été retiré du catalogue</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Le lien vers le produit est invalide ou obsolète</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Problème temporaire de connexion avec nos serveurs</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Le produit est en cours de mise à jour</span>
            </li>
          </ul>
        </div>

        {/* Boutons d'action */}
        <div className="space-y-3">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw size={20} />
            <span>Réessayer de charger le produit</span>
          </button>

          {/* Bouton Voir tous les produits - ACTION PRIORITAIRE */}
          <Link
            href="/"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <ShoppingBag size={20} />
            <span>Voir tous les produits</span>
          </Link>

          {/* Bouton Rechercher */}
          <Link
            href="/?search=true"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-sm"
          >
            <Search size={20} />
            <span>Rechercher un produit</span>
          </Link>

          {/* Bouton Retour */}
          <button
            onClick={() => router.back()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <ArrowLeft size={20} />
            <span>Retour à la page précédente</span>
          </button>
        </div>

        {/* Suggestions d'actions */}
        <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-2 text-sm">
            Que puis-je faire ?
          </h3>
          <ul className="text-sm text-amber-800 space-y-1.5">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>
                <strong>Réessayez</strong> de charger la page - le problème peut
                être temporaire
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                <strong>Parcourez notre catalogue</strong> pour découvrir
                d&apos;autres produits similaires
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>
                <strong>Utilisez la recherche</strong> pour trouver le produit
                que vous cherchez
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>
                <strong>Vérifiez votre connexion</strong> Internet et
                rafraîchissez la page
              </span>
            </li>
          </ul>
        </div>

        {/* Section alternatives de navigation */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-3 text-sm">
            Explorer nos produits
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/?sort=popular"
              className="text-sm text-gray-700 hover:text-blue-600 underline"
            >
              Produits populaires
            </Link>
            <Link
              href="/?sort=newest"
              className="text-sm text-gray-700 hover:text-blue-600 underline"
            >
              Nouveautés
            </Link>
            <Link
              href="/?sort=price_asc"
              className="text-sm text-gray-700 hover:text-blue-600 underline"
            >
              Petits prix
            </Link>
            <Link
              href="/?featured=true"
              className="text-sm text-gray-700 hover:text-blue-600 underline"
            >
              Promotions
            </Link>
          </div>
        </div>

        {/* Message de produit potentiellement introuvable */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
          <h3 className="font-semibold text-red-900 mb-2 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            Le produit n&apos;existe plus ?
          </h3>
          <p className="text-sm text-red-800 leading-relaxed mb-3">
            Si ce produit a été retiré de notre catalogue, nous vous invitons à
            parcourir notre sélection pour découvrir des alternatives
            similaires.
          </p>
          <Link
            href="/"
            className="inline-flex items-center text-sm text-red-900 hover:text-red-950 underline font-medium"
          >
            <ShoppingBag size={14} className="mr-1" />
            Découvrir notre catalogue complet
          </Link>
        </div>

        {/* Aide supplémentaire */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            Besoin d&apos;aide ?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Si vous cherchez un produit spécifique et ne parvenez pas à le
            trouver, notre équipe peut vous aider à le localiser ou vous
            proposer des alternatives.
          </p>
          <div className="space-y-2">
            <Link
              href="/contact"
              className="text-sm text-blue-600 hover:text-blue-700 underline font-medium block"
            >
              Contacter le service client
            </Link>
            <Link
              href="/help"
              className="text-sm text-gray-600 hover:text-gray-700 underline block"
            >
              Centre d&apos;aide
            </Link>
          </div>
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
              {typeof window !== "undefined" && (
                <div className="text-xs">
                  <span className="font-medium text-red-900">Product ID:</span>{" "}
                  <span className="text-red-700 font-mono">
                    {window.location.pathname.split("/").pop()}
                  </span>
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

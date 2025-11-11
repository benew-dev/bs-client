// app/review-order/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ClipboardX,
  Home,
  RefreshCw,
  ShoppingCart,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /review-order
 * Capture toutes les erreurs non gérées de la page de révision de commande
 *
 * Contexte spécifique:
 * - Erreur avant validation finale de la commande
 * - Utilisateur sur le point de confirmer sa commande
 * - Données de panier et paiement déjà renseignées
 * - Situation critique car blocage avant confirmation
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function ReviewOrderError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte critique
    Sentry.captureException(error, {
      tags: {
        error_boundary: "review-order",
        component: "review-order-error",
        page: "/review-order",
        critical: true, // Critique car blocage avant confirmation
        business_impact: "high", // Impact business élevé
        checkout_step: "review", // Étape du tunnel de conversion
      },
      contexts: {
        order: {
          description:
            "Erreur lors de la révision de commande avant confirmation",
          userAction: "Tentative de révision des détails de commande",
          impact: "L'utilisateur ne peut pas confirmer sa commande",
          checkoutStage: "review",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
      },
      level: "error", // Error car avant paiement (pas fatal comme post-commande)
    });

    // Log pour le débogage local
    console.error("Review Order Error Boundary caught error:", {
      name: error.name,
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, [error]);

  // Fonction de réessai avec router.refresh()
  const handleRetry = () => {
    reset(); // Efface l'erreur
    router.refresh(); // Force un re-fetch des données serveur
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Icône d'erreur avec clipboard */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <ClipboardX
                className="text-red-600"
                size={48}
                strokeWidth={1.5}
              />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <AlertTriangle
                className="text-white"
                size={16}
                strokeWidth={2.5}
              />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Erreur lors de la révision de votre commande
        </h1>

        {/* Message rassurant */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-blue-900 mb-2 text-lg">
                Vos données sont sécurisées
              </h2>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Rassurez-vous, aucune commande n&apos;a été créée et aucun
                paiement n&apos;a été effectué. Vos informations de panier et de
                paiement sont toujours sauvegardées.
              </p>
              <div className="bg-white/70 rounded-lg p-3 border border-blue-300">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  ✅ Ce qui est préservé :
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Votre panier avec tous les articles sélectionnés
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Vos informations de paiement renseignées</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Vos choix de livraison (si applicable)</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Message principal */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Une erreur technique empêche l&apos;affichage du récapitulatif de
          votre commande. Notre équipe a été automatiquement notifiée. Vous
          pouvez réessayer ou revenir à l&apos;étape précédente.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-3 mb-8">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw size={20} />
            <span>Réessayer d&apos;afficher la révision</span>
          </button>

          {/* Bouton Retour au paiement - ACTION PRIORITAIRE */}
          <Link
            href="/payment"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <CreditCard size={20} />
            <span>Retour aux informations de paiement</span>
          </Link>

          {/* Bouton Voir le panier */}
          <Link
            href="/cart"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <ShoppingCart size={20} />
            <span>Voir mon panier</span>
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

        {/* Suggestions et alternatives */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600" />
            Solutions alternatives
          </h3>
          <div className="space-y-3 text-sm text-amber-800">
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">1.</span>
              <p>
                <span className="font-semibold">
                  Vérifiez votre connexion Internet
                </span>{" "}
                - Une connexion instable peut causer ce problème
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">2.</span>
              <p>
                <span className="font-semibold">
                  Revenez à l&apos;étape précédente
                </span>{" "}
                - Vérifiez vos informations de paiement et réessayez
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">3.</span>
              <p>
                <span className="font-semibold">Vérifiez votre panier</span> -
                Assurez-vous que tous les articles sont toujours disponibles
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">4.</span>
              <p>
                <span className="font-semibold">
                  Videz le cache de votre navigateur
                </span>{" "}
                - Cela peut résoudre certains problèmes d&apos;affichage
              </p>
            </div>
          </div>
        </div>

        {/* Informations importantes */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle size={18} className="text-blue-600" />
            Important à savoir
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start">
              <span className="mr-2">📦</span>
              <span>
                Les articles de votre panier restent réservés pendant votre
                session
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">💳</span>
              <span>
                Aucun paiement ne sera effectué tant que vous n&apos;aurez pas
                confirmé votre commande
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">🔒</span>
              <span>
                Vos informations de paiement sont stockées de manière sécurisée
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">⏰</span>
              <span>
                Si vous quittez maintenant, vous pourrez reprendre votre
                commande plus tard
              </span>
            </p>
          </div>
        </div>

        {/* Aide supplémentaire */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Besoin d&apos;aide ?
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="flex items-start">
              <span className="mr-2">🛒</span>
              <span>
                Consultez{" "}
                <Link
                  href="/cart"
                  className="text-blue-600 hover:underline font-medium"
                >
                  votre panier
                </Link>{" "}
                pour vérifier vos articles
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">💬</span>
              <span>
                Contactez-nous via{" "}
                <Link
                  href="/me/contact"
                  className="text-blue-600 hover:underline font-medium"
                >
                  votre espace personnel
                </Link>{" "}
                si le problème persiste
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">📱</span>
              <span>Utilisez WhatsApp/SMS pour une assistance rapide</span>
            </p>
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
      </div>
    </div>
  );
}

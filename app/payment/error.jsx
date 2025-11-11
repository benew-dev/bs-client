// app/payment/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CreditCard,
  Home,
  RefreshCw,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /payment
 * Capture toutes les erreurs non gérées de la page de sélection de paiement
 *
 * Contexte spécifique:
 * - Erreur lors de la sélection du moyen de paiement
 * - Étape cruciale du tunnel de conversion
 * - L'utilisateur a déjà son panier prêt
 * - Blocage avant la révision de commande
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function PaymentError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte critique
    Sentry.captureException(error, {
      tags: {
        error_boundary: "payment",
        component: "payment-error",
        page: "/payment",
        critical: true, // Critique car blocage dans le tunnel de conversion
        business_impact: "high", // Impact business très élevé
        checkout_step: "payment_selection", // Étape du tunnel
      },
      contexts: {
        payment: {
          description: "Erreur lors de la sélection du moyen de paiement",
          userAction: "Tentative de choix d'un moyen de paiement",
          impact: "L'utilisateur ne peut pas sélectionner de moyen de paiement",
          checkoutStage: "payment_selection",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
      },
      level: "error", // Error car avant confirmation (pas fatal)
    });

    // Log pour le débogage local
    console.error("Payment Error Boundary caught error:", {
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
        {/* Icône d'erreur avec carte de crédit */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <CreditCard
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
          Erreur lors du chargement des moyens de paiement
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
                Votre panier est sécurisé
              </h2>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Rassurez-vous, tous les articles de votre panier sont toujours
                sauvegardés et disponibles. Seul l&apos;affichage des moyens de
                paiement rencontre un problème technique.
              </p>
              <div className="bg-white/70 rounded-lg p-3 border border-blue-300">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  ✅ Ce qui est préservé :
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Tous vos articles sélectionnés dans le panier</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Les quantités et prix de vos produits</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Votre session active sur le site</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Message principal */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Une erreur technique empêche l&apos;affichage des moyens de paiement
          disponibles. Notre équipe a été automatiquement notifiée. Vous pouvez
          réessayer ou revenir à votre panier.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-3 mb-8">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw size={20} />
            <span>Réessayer de charger les moyens de paiement</span>
          </button>

          {/* Bouton Retour au panier - ACTION PRIORITAIRE */}
          <Link
            href="/cart"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <ShoppingCart size={20} />
            <span>Retour au panier</span>
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

        {/* Causes possibles et solutions */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <HelpCircle size={20} className="text-amber-600" />
            Causes possibles et solutions
          </h3>
          <div className="space-y-3 text-sm text-amber-800">
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">1.</span>
              <div>
                <p className="font-semibold">Problème de connexion Internet</p>
                <p className="text-amber-700 mt-1">
                  Vérifiez votre connexion et réessayez. Une connexion instable
                  peut empêcher le chargement des moyens de paiement.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">2.</span>
              <div>
                <p className="font-semibold">Maintenance temporaire</p>
                <p className="text-amber-700 mt-1">
                  Nos services de paiement peuvent être temporairement en
                  maintenance. Réessayez dans quelques minutes.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">3.</span>
              <div>
                <p className="font-semibold">Cache du navigateur</p>
                <p className="text-amber-700 mt-1">
                  Essayez de vider le cache de votre navigateur et de rafraîchir
                  la page.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">4.</span>
              <div>
                <p className="font-semibold">Session expirée</p>
                <p className="text-amber-700 mt-1">
                  Votre session a peut-être expiré. Retournez au panier et
                  réessayez.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Informations sur les moyens de paiement disponibles */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Wallet size={20} className="text-blue-600" />
            Moyens de paiement habituellement disponibles
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p className="flex items-start">
              <span className="mr-2">💳</span>
              <span>
                <strong>Paiements mobiles :</strong> Waafi, D-Money, CAC Pay,
                BCI Pay
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">💵</span>
              <span>
                <strong>Paiement en espèces :</strong> Lors de la récupération
                de votre commande
              </span>
            </p>
            <p className="flex items-start mt-3 pt-3 border-t border-gray-200">
              <span className="mr-2">ℹ️</span>
              <span className="text-gray-600">
                Si vous continuez à rencontrer ce problème, vous pouvez nous
                contacter pour finaliser votre commande manuellement.
              </span>
            </p>
          </div>
        </div>

        {/* Actions alternatives */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            Que faire maintenant ?
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start">
              <span className="mr-2">1️⃣</span>
              <div>
                <p className="font-medium">Réessayez dans quelques instants</p>
                <p className="text-gray-600 mt-1">
                  Le problème peut être temporaire. Attendez 2-3 minutes et
                  cliquez sur &quot;Réessayer&quot;.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-2">2️⃣</span>
              <div>
                <p className="font-medium">Vérifiez votre panier</p>
                <p className="text-gray-600 mt-1">
                  Retournez à{" "}
                  <Link
                    href="/cart"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    votre panier
                  </Link>{" "}
                  pour vérifier que tous vos articles sont bien présents.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="mr-2">3️⃣</span>
              <div>
                <p className="font-medium">Contactez-nous pour assistance</p>
                <p className="text-gray-600 mt-1">
                  Si le problème persiste, contactez-nous via{" "}
                  <Link
                    href="/me/contact"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    votre espace personnel
                  </Link>{" "}
                  ou par WhatsApp/SMS.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message de réassurance */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <div className="p-2 bg-green-100 rounded-full">
                <ShoppingCart className="text-green-600" size={20} />
              </div>
            </div>
            <div className="ml-3">
              <h4 className="font-semibold text-green-900 mb-1">
                Vos articles vous attendent
              </h4>
              <p className="text-sm text-green-700">
                Vos articles resteront dans votre panier. Vous pouvez revenir à
                tout moment pour finaliser votre achat, même après avoir quitté
                le site.
              </p>
            </div>
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

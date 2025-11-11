// app/confirmation/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  PackageX,
  Home,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /confirmation
 * Capture toutes les erreurs non gérées de la page de confirmation
 *
 * Contexte spécifique:
 * - Erreur après passage de commande (situation critique)
 * - Utilisateur peut avoir payé ou être sur le point de payer
 * - Nécessite une assistance immédiate
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function ConfirmationError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte très critique
    Sentry.captureException(error, {
      tags: {
        error_boundary: "confirmation",
        component: "confirmation-error",
        page: "/confirmation",
        critical: true, // TRÈS critique car post-commande
        business_impact: "high", // Impact business élevé
      },
      contexts: {
        order: {
          description:
            "Erreur lors de l'affichage de la confirmation de commande",
          userAction: "Consultation de la confirmation après commande",
          impact: "L'utilisateur ne peut pas voir sa confirmation de commande",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
      },
      level: "fatal", // Fatal car empêche la confirmation post-commande
    });

    // Log pour le débogage local
    console.error("Confirmation Error Boundary caught error:", {
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
        {/* Icône d'erreur avec package */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <PackageX className="text-red-600" size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <AlertCircle className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Erreur lors de l&apos;affichage de votre confirmation
        </h1>

        {/* Message rassurant */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingBag className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-blue-900 mb-2 text-lg">
                Votre commande a bien été enregistrée
              </h2>
              <p className="text-blue-800 text-sm leading-relaxed mb-3">
                Rassurez-vous, votre commande a été traitée avec succès. Seul
                l&apos;affichage de la page de confirmation rencontre un
                problème technique.
              </p>
              <div className="bg-white/70 rounded-lg p-3 border border-blue-300">
                <p className="text-sm text-blue-900 font-medium mb-2">
                  ✅ Ce qui a été fait :
                </p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      Votre commande est bien enregistrée dans notre système
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Vous avez reçu un numéro de commande</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Les articles sont réservés pour vous</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Message principal */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Une erreur technique empêche l&apos;affichage de votre confirmation de
          commande. Notre équipe a été automatiquement notifiée et vous pouvez
          retrouver toutes les informations de votre commande dans votre espace
          personnel.
        </p>

        {/* Boutons d'action */}
        <div className="space-y-3 mb-8">
          {/* Bouton Réessayer */}
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <RefreshCw size={20} />
            <span>Réessayer d&apos;afficher la confirmation</span>
          </button>

          {/* Bouton Mes commandes - ACTION PRIORITAIRE */}
          <Link
            href="/me/orders"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <ShoppingBag size={20} />
            <span>Voir mes commandes</span>
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

        {/* Instructions importantes */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-5 mb-6">
          <h3 className="font-semibold text-amber-900 mb-3 text-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-amber-600" />
            Prochaines étapes importantes
          </h3>
          <div className="space-y-3 text-sm text-amber-800">
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">1.</span>
              <p>
                <span className="font-semibold">
                  Consultez votre espace personnel
                </span>{" "}
                pour retrouver votre numéro de commande et les informations de
                paiement
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">2.</span>
              <p>
                <span className="font-semibold">Effectuez le paiement</span> via
                l&apos;un des moyens de paiement disponibles
              </p>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2 text-amber-900">3.</span>
              <p>
                <span className="font-semibold">
                  Envoyez-nous la confirmation
                </span>{" "}
                de paiement avec votre numéro de commande via votre espace
                personnel
              </p>
            </div>
          </div>
        </div>

        {/* Aide supplémentaire */}
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h3 className="font-semibold text-gray-900 mb-3">
            Besoin d&apos;aide ?
          </h3>
          <div className="space-y-3 text-sm text-gray-700">
            <p className="flex items-start">
              <span className="mr-2">📋</span>
              <span>
                Retrouvez toutes les informations de votre commande dans{" "}
                <Link
                  href="/me/orders"
                  className="text-blue-600 hover:underline font-medium"
                >
                  Mes commandes
                </Link>
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">💬</span>
              <span>
                Pour toute question, contactez-nous via{" "}
                <Link
                  href="/me/contact"
                  className="text-blue-600 hover:underline font-medium"
                >
                  votre espace personnel
                </Link>
              </span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">📱</span>
              <span>Ou utilisez WhatsApp/SMS pour une assistance rapide</span>
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

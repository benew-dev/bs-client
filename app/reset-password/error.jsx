// app/reset-password/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Home,
  RefreshCw,
  Mail,
  AlertCircle,
  KeyRound,
  Clock,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /reset-password
 * Capture toutes les erreurs non gérées de la page de réinitialisation avec token
 *
 * Contexte spécifique:
 * - Erreur lors du chargement/affichage de la page de réinitialisation
 * - L'utilisateur a cliqué sur un lien de réinitialisation par email
 * - Fonctionnalité critique pour la récupération de compte
 * - Erreur empêche l'accès au formulaire de création de nouveau mot de passe
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function ResetPasswordError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "reset-password",
        component: "reset-password-error",
        page: "/reset-password",
        critical: true, // Critique car empêche la réinitialisation
        business_impact: "high", // Impact élevé (utilisateur bloqué après email)
        security_related: true, // Lié à la sécurité du compte
        user_flow: "password_recovery", // Flux de récupération
      },
      contexts: {
        password_reset: {
          description:
            "Erreur lors de l'affichage de la page de réinitialisation de mot de passe",
          userAction:
            "Tentative d'accès à la page de réinitialisation via lien email",
          impact: "L'utilisateur ne peut pas créer un nouveau mot de passe",
          scenario:
            "Utilisateur a reçu un email et cliqué sur le lien de réinitialisation",
        },
      },
      extra: {
        digest: error.digest,
        errorName: error.name,
        errorMessage: error.message,
        stackTrace: error.stack,
        timestamp: new Date().toISOString(),
        hasToken:
          typeof window !== "undefined" &&
          window.location.search.includes("token"),
      },
      level: "error",
    });

    // Log pour le débogage local (sera supprimé en prod par next.config)
    console.error("ResetPassword Error Boundary caught error:", {
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
        {/* Icône d'erreur avec bouclier */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <ShieldCheck
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
          Erreur lors du chargement de la page de réinitialisation
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors du
          chargement de la page de réinitialisation de mot de passe. Notre
          équipe a été automatiquement notifiée et travaille pour résoudre ce
          problème.
        </p>

        {/* Message spécifique contexte token */}
        <div className="mb-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Avez-vous cliqué sur un lien de réinitialisation ?
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Si vous avez reçu un email de réinitialisation et que le lien ne
                fonctionne pas, il est possible que :
              </p>
              <ul className="mt-2 text-xs text-amber-700 space-y-1 list-disc pl-5">
                <li>Le lien ait expiré (valide 1 heure)</li>
                <li>Le lien ait déjà été utilisé</li>
                <li>Il y ait un problème technique temporaire</li>
              </ul>
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

          {/* Bouton Demander un nouveau lien - ACTION PRIORITAIRE */}
          <Link
            href="/forgot-password"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <Mail size={20} />
            <span>Demander un nouveau lien</span>
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
              <span>
                Essayez de cliquer à nouveau sur le lien dans l&apos;email
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Copiez-collez le lien complet dans votre navigateur</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>Demandez un nouveau lien si le vôtre a expiré</span>
            </li>
          </ul>
        </div>

        {/* Section d'aide pour les liens expirés */}
        <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-2 text-sm flex items-center gap-2">
            <KeyRound size={16} className="text-purple-600" />
            Lien expiré ou invalide ?
          </h3>
          <p className="text-sm text-purple-800 leading-relaxed mb-3">
            Les liens de réinitialisation expirent après 1 heure pour votre
            sécurité. Si votre lien a expiré ou a déjà été utilisé, demandez
            simplement un nouveau lien.
          </p>
          <Link
            href="/forgot-password"
            className="inline-flex items-center text-sm text-purple-900 hover:text-purple-950 underline font-medium"
          >
            <Mail size={14} className="mr-1" />
            Demander un nouveau lien de réinitialisation
          </Link>
        </div>

        {/* Aide support */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            Besoin d&apos;aide supplémentaire ?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Si vous continuez à rencontrer des problèmes pour réinitialiser
            votre mot de passe, ou si vous n&apos;avez plus accès à votre
            adresse email, notre équipe de support peut vous aider.
          </p>
          <div className="space-y-2">
            <Link
              href="/contact"
              className="text-sm text-blue-600 hover:text-blue-700 underline font-medium block"
            >
              Contacter le support
            </Link>
            <Link
              href="/help/password-reset"
              className="text-sm text-gray-600 hover:text-gray-700 underline block"
            >
              Guide de réinitialisation de mot de passe
            </Link>
          </div>
        </div>

        {/* Vérification de sécurité */}
        <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-100">
          <h3 className="font-semibold text-red-900 mb-2 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600" />
            Important - Sécurité
          </h3>
          <p className="text-xs text-red-800 leading-relaxed">
            ⚠️ N&apos;utilisez jamais un lien de réinitialisation provenant
            d&apos;un email suspect. Vérifiez toujours que l&apos;URL commence
            par{" "}
            <span className="font-mono font-semibold">
              {typeof window !== "undefined"
                ? window.location.origin
                : "votre-domaine"}
            </span>
          </p>
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
                  <span className="font-medium text-red-900">Has Token:</span>{" "}
                  <span className="text-red-700">
                    {window.location.search.includes("token") ? "Yes" : "No"}
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

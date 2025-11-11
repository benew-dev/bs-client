// app/forgot-password/error.jsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  KeyRound,
  Home,
  RefreshCw,
  LogIn,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";
import * as Sentry from "@sentry/nextjs";

/**
 * Composant Error Boundary pour la route /forgot-password
 * Capture toutes les erreurs non gérées de la page de réinitialisation de mot de passe
 *
 * Contexte spécifique:
 * - Erreur lors du chargement/affichage de la page de réinitialisation
 * - Fonctionnalité critique pour la récupération de compte
 * - Erreur empêche l'accès au formulaire de demande de réinitialisation
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */
export default function ForgotPasswordError({ error, reset }) {
  const router = useRouter();

  useEffect(() => {
    // Capturer l'erreur dans Sentry avec contexte complet
    Sentry.captureException(error, {
      tags: {
        error_boundary: "forgot-password",
        component: "forgot-password-error",
        page: "/forgot-password",
        critical: true, // Critique car empêche la récupération de compte
        business_impact: "medium", // Impact moyen (fonctionnalité de récupération)
        security_related: true, // Lié à la sécurité du compte
      },
      contexts: {
        password_recovery: {
          description:
            "Erreur lors de l'affichage de la page de réinitialisation de mot de passe",
          userAction: "Tentative d'accès à la page de mot de passe oublié",
          impact:
            "L'utilisateur ne peut pas demander la réinitialisation de son mot de passe",
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
    console.error("ForgotPassword Error Boundary caught error:", {
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
        {/* Icône d'erreur avec clé */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="bg-red-100 rounded-full p-6">
              <KeyRound className="text-red-600" size={48} strokeWidth={1.5} />
            </div>
            <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-2">
              <AlertCircle className="text-white" size={16} strokeWidth={2.5} />
            </div>
          </div>
        </div>

        {/* Titre */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-3">
          Erreur lors du chargement de la page
        </h1>

        {/* Message */}
        <p className="text-center text-gray-600 mb-8 leading-relaxed">
          Nous sommes désolés, une erreur inattendue s&apos;est produite lors du
          chargement de la page de réinitialisation de mot de passe. Notre
          équipe a été automatiquement notifiée et travaille pour résoudre ce
          problème.
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

          {/* Bouton Se connecter - Alternative si l'utilisateur se souvient */}
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-sm"
          >
            <LogIn size={20} />
            <span>Se connecter</span>
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
              <span>
                Si vous vous souvenez de votre mot de passe, essayez de vous
                connecter
              </span>
            </li>
          </ul>
        </div>

        {/* Message d'aide alternative */}
        <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
          <h3 className="font-semibold text-amber-900 mb-2 text-sm flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-600" />
            Vous vous souvenez de votre mot de passe ?
          </h3>
          <p className="text-sm text-amber-800 leading-relaxed mb-3">
            Si vous vous souvenez finalement de votre mot de passe, vous pouvez{" "}
            <Link
              href="/login"
              className="text-amber-900 hover:text-amber-950 underline font-medium"
            >
              vous connecter directement
            </Link>{" "}
            sans réinitialiser votre mot de passe.
          </p>
          <p className="text-xs text-amber-700">
            💡 Astuce : Vérifiez votre gestionnaire de mots de passe ou vos
            notes sécurisées
          </p>
        </div>

        {/* Aide contact support */}
        <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2 text-sm">
            Besoin d&apos;aide pour accéder à votre compte ?
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Si vous continuez à rencontrer des problèmes ou si vous n&apos;avez
            plus accès à votre adresse email, notre équipe de support peut vous
            aider à récupérer votre compte.
          </p>
          <Link
            href="/contact"
            className="text-sm text-blue-600 hover:text-blue-700 underline font-medium"
          >
            Contacter le support
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

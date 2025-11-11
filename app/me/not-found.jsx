// app/me/not-found.jsx
import Link from "next/link";
import { User, ShoppingBag, Settings, Lock, Mail, Home } from "lucide-react";

/**
 * Composant Not Found pour la section /me (espace personnel)
 * Affiché lorsqu'une route n'existe pas dans l'espace utilisateur
 *
 * Contexte:
 * - Page protégée (authentification requise)
 * - Route inexistante dans l'espace personnel
 * - L'utilisateur cherche une page de son profil qui n'existe pas
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

export const metadata = {
  title: "Page introuvable - Mon compte | Buy It Now",
  description: "Cette page de votre espace personnel n'existe pas.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MeNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Animation 404 avec icône utilisateur */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Cercle de fond animé */}
            <div className="absolute inset-0 bg-purple-100 rounded-full animate-pulse"></div>

            {/* Icône et texte 404 */}
            <div className="relative bg-white rounded-full p-8 shadow-lg">
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-bold text-purple-600 mb-2">
                  404
                </div>
                <User
                  className="mx-auto text-purple-500"
                  size={32}
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Page introuvable dans votre espace
        </h1>

        {/* Message explicatif */}
        <p className="text-center text-gray-600 text-lg mb-8 leading-relaxed">
          La page que vous recherchez n&apos;existe pas dans votre espace
          personnel ou a été déplacée. Explorez les sections disponibles
          ci-dessous.
        </p>

        {/* Carte avec les pages disponibles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Settings size={20} className="text-purple-600" />
            Pages disponibles dans votre espace
          </h2>

          <div className="space-y-3">
            {/* Mon profil */}
            <Link
              href="/me"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <User size={24} className="text-purple-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-purple-600">
                  Mon profil
                </div>
                <div className="text-sm text-gray-500">
                  Consulter et gérer mes informations personnelles
                </div>
              </div>
            </Link>

            {/* Mes commandes */}
            <Link
              href="/me/orders"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <ShoppingBag size={24} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-blue-600">
                  Mes commandes
                </div>
                <div className="text-sm text-gray-500">
                  Voir l&apos;historique de mes achats et suivre mes livraisons
                </div>
              </div>
            </Link>

            {/* Modifier mon profil */}
            <Link
              href="/me/update"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Settings size={24} className="text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-green-600">
                  Modifier mon profil
                </div>
                <div className="text-sm text-gray-500">
                  Mettre à jour mes informations et mon adresse
                </div>
              </div>
            </Link>

            {/* Changer mon mot de passe */}
            <Link
              href="/me/update_password"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Lock size={24} className="text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-orange-600">
                  Changer mon mot de passe
                </div>
                <div className="text-sm text-gray-500">
                  Sécuriser mon compte avec un nouveau mot de passe
                </div>
              </div>
            </Link>

            {/* Contacter le support */}
            <Link
              href="/me/contact"
              className="flex items-center gap-4 p-4 rounded-lg border-2 border-gray-200 hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                <Mail size={24} className="text-cyan-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900 group-hover:text-cyan-600">
                  Contacter le support
                </div>
                <div className="text-sm text-gray-500">
                  Obtenir de l&apos;aide ou poser une question
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Retour à l'accueil */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home size={20} />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        {/* Section aide */}
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
          <h3 className="font-semibold text-purple-900 mb-3 text-center">
            Cette page devrait exister ?
          </h3>
          <p className="text-sm text-purple-800 text-center mb-4">
            Si vous pensez que cette fonctionnalité devrait être disponible dans
            votre espace personnel, contactez-nous pour nous en informer.
          </p>
          <div className="flex justify-center">
            <Link
              href="/me/contact"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <Mail className="w-4 h-4 mr-2" />
              Contacter le support
            </Link>
          </div>
        </div>

        {/* Footer informatif */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Code erreur: <span className="font-mono font-semibold">404</span> -
            Page Not Found
            <br />
            <span className="text-xs">Espace: Mon compte (/me)</span>
          </p>
        </div>
      </div>
    </div>
  );
}

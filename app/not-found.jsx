// app/not-found.jsx
import Link from "next/link";
import { Home, Search, ShoppingBag, MapPin, Package } from "lucide-react";

/**
 * Composant Not Found global pour Next.js 15 App Router
 * Affiché lorsqu'une route n'existe pas dans l'application
 *
 * Contexte:
 * - Page publique accessible à tous
 * - Route inexistante saisie par l'utilisateur
 * - Erreur 404 - Page non trouvée
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

export const metadata = {
  title: "Page introuvable - 404 | Buy It Now",
  description: "La page que vous recherchez n'existe pas ou a été déplacée.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Animation 404 avec icône */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Cercle de fond animé */}
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-pulse"></div>

            {/* Texte 404 stylisé */}
            <div className="relative bg-white rounded-full p-8 shadow-lg">
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-bold text-blue-600 mb-2">
                  404
                </div>
                <MapPin
                  className="mx-auto text-blue-500"
                  size={32}
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Page introuvable
        </h1>

        {/* Message explicatif */}
        <p className="text-center text-gray-600 text-lg mb-8 leading-relaxed">
          Oups ! La page que vous recherchez n&apos;existe pas ou a été
          déplacée. Ne vous inquiétez pas, nous sommes là pour vous aider à
          retrouver votre chemin.
        </p>

        {/* Carte avec suggestions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-blue-600" />
            Suggestions pour continuer
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Retour à l'accueil */}
            <Link
              href="/"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Home size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-blue-600">
                  Retour à l&apos;accueil
                </div>
                <div className="text-sm text-gray-500">
                  Voir notre catalogue
                </div>
              </div>
            </Link>

            {/* Voir les produits */}
            <Link
              href="/"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Package size={20} className="text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-green-600">
                  Nos produits
                </div>
                <div className="text-sm text-gray-500">
                  Découvrir le catalogue
                </div>
              </div>
            </Link>

            {/* Mon panier */}
            <Link
              href="/cart"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <ShoppingBag size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-orange-600">
                  Mon panier
                </div>
                <div className="text-sm text-gray-500">Voir mes articles</div>
              </div>
            </Link>

            {/* Mon compte */}
            <Link
              href="/me"
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <svg
                  className="w-5 h-5 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-900 group-hover:text-purple-600">
                  Mon compte
                </div>
                <div className="text-sm text-gray-500">
                  Accéder à mon profil
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Section aide */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 text-center">
            Besoin d&apos;aide ?
          </h3>
          <p className="text-sm text-blue-800 text-center mb-4">
            Si vous pensez que cette page devrait exister ou si vous avez été
            redirigé ici par erreur, n&apos;hésitez pas à nous contacter.
          </p>
          <div className="flex justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Contacter le support
            </Link>
          </div>
        </div>

        {/* Footer informatif */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Code erreur: <span className="font-mono font-semibold">404</span> -
            Page Not Found
          </p>
        </div>
      </div>
    </div>
  );
}

// app/product/[id]/not-found.jsx
import Link from "next/link";
import { Package, Search, ShoppingBag, Home } from "lucide-react";

/**
 * Composant Not Found pour un produit spécifique
 * Affiché lorsqu'un produit n'existe pas ou a été supprimé
 *
 * Contexte:
 * - Page publique
 * - Produit inexistant, supprimé ou ID invalide
 * - Impact critique sur le tunnel de conversion
 * - Opportunité de rediriger vers d'autres produits
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/not-found
 */

export const metadata = {
  title: "Produit introuvable - 404 | Buy It Now",
  description:
    "Le produit que vous recherchez n'existe pas ou n'est plus disponible.",
  robots: {
    index: false,
    follow: true, // Follow pour les autres liens de navigation
  },
};

export default function ProductNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Animation 404 avec package */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            {/* Cercle de fond animé */}
            <div className="absolute inset-0 bg-orange-100 rounded-full animate-pulse"></div>

            {/* Icône et texte 404 */}
            <div className="relative bg-white rounded-full p-8 shadow-lg">
              <div className="text-center">
                <div className="text-6xl md:text-7xl font-bold text-orange-600 mb-2">
                  404
                </div>
                <Package
                  className="mx-auto text-orange-500"
                  size={32}
                  strokeWidth={2}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
          Produit introuvable
        </h1>

        {/* Message explicatif */}
        <p className="text-center text-gray-600 text-lg mb-8 leading-relaxed">
          Le produit que vous recherchez n&apos;existe pas, a été retiré de
          notre catalogue ou le lien est invalide. Ne vous inquiétez pas, nous
          avons plein d&apos;autres produits à vous proposer !
        </p>

        {/* Causes possibles */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-orange-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Search size={20} className="text-orange-600" />
            Pourquoi ce produit est introuvable ?
          </h2>

          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 mr-3">
                <span className="text-orange-600 font-semibold text-sm">1</span>
              </div>
              <div>
                <span className="font-medium">Le produit a été retiré</span>
                <p className="text-sm text-gray-600 mt-1">
                  Il n&apos;est plus disponible dans notre catalogue
                </p>
              </div>
            </li>

            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 mr-3">
                <span className="text-orange-600 font-semibold text-sm">2</span>
              </div>
              <div>
                <span className="font-medium">Le lien est obsolète</span>
                <p className="text-sm text-gray-600 mt-1">
                  L&apos;URL provient peut-être d&apos;un ancien favori ou
                  d&apos;un lien partagé
                </p>
              </div>
            </li>

            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 mr-3">
                <span className="text-orange-600 font-semibold text-sm">3</span>
              </div>
              <div>
                <span className="font-medium">Rupture définitive de stock</span>
                <p className="text-sm text-gray-600 mt-1">
                  Le produit était en stock limité et est désormais épuisé
                </p>
              </div>
            </li>

            <li className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 flex items-center justify-center mt-0.5 mr-3">
                <span className="text-orange-600 font-semibold text-sm">4</span>
              </div>
              <div>
                <span className="font-medium">Identifiant invalide</span>
                <p className="text-sm text-gray-600 mt-1">
                  L&apos;ID du produit dans l&apos;URL est incorrect
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* Boutons d'action principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Voir tous les produits - ACTION PRIORITAIRE */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 shadow-sm"
          >
            <ShoppingBag size={20} />
            <span>Voir tous les produits</span>
          </Link>

          {/* Rechercher */}
          <Link
            href="/?search=true"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
          >
            <Search size={20} />
            <span>Rechercher un produit</span>
          </Link>
        </div>

        {/* Actions secondaires */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Retour à l'accueil */}
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            <Home size={20} />
            <span>Accueil</span>
          </Link>
        </div>

        {/* Section aide */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
          <h3 className="font-semibold text-blue-900 mb-3 text-center">
            Vous cherchiez un produit spécifique ?
          </h3>
          <p className="text-sm text-blue-800 text-center mb-4">
            Notre équipe peut vous aider à trouver un produit similaire ou vous
            informer quand il sera de nouveau disponible.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/contact?subject=produit-introuvable"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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

            <Link
              href="/help"
              className="inline-flex items-center justify-center px-4 py-2 bg-white text-blue-600 text-sm font-medium rounded-md border border-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Centre d&apos;aide
            </Link>
          </div>
        </div>

        {/* Footer informatif */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Code erreur: <span className="font-mono font-semibold">404</span> -
            Product Not Found
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Si ce problème persiste, veuillez nous contacter
          </p>
        </div>
      </div>
    </div>
  );
}

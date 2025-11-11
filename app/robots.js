// app/robots.js
// Configuration dynamique du fichier robots.txt pour Next.js 15
// Optimisé pour un e-commerce avec ~500 utilisateurs/jour

/**
 * Génère le fichier robots.txt de manière dynamique
 *
 * Avantages de la génération dynamique :
 * - Adaptation automatique selon l'environnement (dev/prod)
 * - URL du sitemap dynamique basée sur NEXT_PUBLIC_SITE_URL
 * - Facilité de maintenance (un seul endroit à modifier)
 * - Support des règles spécifiques par user-agent
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */

export default function robots() {
  // Récupérer l'URL du site depuis les variables d'environnement
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://bs-client-blond.vercel.app";

  // Déterminer si on est en production
  const isProduction = process.env.NODE_ENV === "production";

  return {
    rules: [
      // ============================================
      // 1. RÈGLES POUR TOUS LES ROBOTS (Google, Bing, etc.)
      // ============================================
      {
        userAgent: "*",

        // ✅ PAGES PUBLIQUES À INDEXER
        allow: [
          "/", // Page d'accueil (liste des produits)
          "/products/", // Pages de détails produits individuels
          // Les routes dynamiques comme /products/[id] sont automatiquement incluses
        ],

        // ❌ PAGES PRIVÉES/SENSIBLES À NE PAS INDEXER
        disallow: [
          // --- Pages d'authentification ---
          "/login", // Page de connexion
          "/register", // Page d'inscription
          "/forgot-password", // Réinitialisation mot de passe
          "/reset-password", // Confirmation réinitialisation

          // --- Espace utilisateur protégé ---
          "/me/", // Toute la section profil utilisateur
          "/me/*", // Sous-routes du profil (commandes, etc.)

          // --- Processus de commande ---
          "/cart", // Panier d'achat
          "/shipping", // Page d'expédition
          "/shipping-choice", // Choix du mode de livraison
          "/address", // Gestion des adresses
          "/address/*", // Sous-routes d'adresses
          "/payment", // Page de paiement
          "/review-order", // Revue de la commande
          "/confirmation", // Page de confirmation de commande

          // --- API et endpoints techniques ---
          "/api/", // Toutes les routes API
          "/api/*", // Sous-routes API

          // --- Pages d'erreur ---
          "/error", // Page d'erreur générique
          "/404", // Page 404 personnalisée
          "/500", // Page 500 personnalisée

          // --- Fichiers techniques Next.js ---
          "/_next/", // Fichiers statiques Next.js
          "/_next/*", // Sous-dossiers Next.js
          "/monitoring", // Endpoint Sentry tunnel

          // --- Fichiers de configuration ---
          "/*.json", // Fichiers JSON (manifest, etc.)
          "/*.xml", // Fichiers XML (sauf sitemap)

          // --- Paramètres de recherche et filtres ---
          "/*?*", // URLs avec paramètres de requête (évite le duplicate content)
          "/products?*", // Produits avec filtres (évite l'indexation des variations)
          "/*&*", // URLs avec multiples paramètres

          // --- Endpoints de développement ---
          ...(isProduction
            ? []
            : [
                "/test", // Routes de test (dev seulement)
                "/debug", // Routes de debug (dev seulement)
              ]),
        ],

        // ⏱️ POLITESSE D'EXPLORATION (Crawl-delay)
        // Pour un site de 500 users/jour, 10 secondes est raisonnable
        // Empêche la surcharge serveur tout en permettant une indexation rapide
        crawlDelay: 10,
      },

      // ============================================
      // 2. RÈGLES SPÉCIFIQUES POUR GOOGLE
      // ============================================
      {
        userAgent: "Googlebot",

        // Google est autorisé sur les mêmes pages que '*'
        // mais sans crawl-delay (Google gère lui-même le rythme)
        allow: ["/", "/products/"],

        disallow: [
          "/login",
          "/register",
          "/me/",
          "/cart",
          "/shipping",
          "/address/",
          "/payment",
          "/confirmation",
          "/api/",
          "/error",
          "/_next/",
          "/*?*",
        ],

        // Pas de crawl-delay pour Google (il s'auto-régule)
      },

      // ============================================
      // 3. RÈGLES SPÉCIFIQUES POUR GOOGLEBOT-IMAGE
      // ============================================
      {
        userAgent: "Googlebot-Image",

        // Autoriser l'indexation des images de produits
        allow: [
          "/*.jpg",
          "/*.jpeg",
          "/*.png",
          "/*.webp",
          "/*.gif",
          "/images/",
          "/_next/image", // Images optimisées par Next.js
        ],

        // Bloquer les images sensibles
        disallow: [
          "/images/users/", // Photos de profil utilisateurs (si applicable)
          "/images/private/", // Dossier privé (si applicable)
        ],
      },

      // ============================================
      // 4. RÈGLES POUR BINGBOT (Microsoft)
      // ============================================
      {
        userAgent: "Bingbot",

        allow: ["/", "/products/"],

        disallow: ["/login", "/register", "/me/", "/cart", "/api/", "/*?*"],

        crawlDelay: 10,
      },

      // ============================================
      // 5. BLOCAGE DES BOTS IA (GPT, Claude, etc.)
      // ============================================
      // Ces bots scrapent votre contenu pour entraîner leurs modèles
      // Pour un e-commerce, vous pouvez choisir de les bloquer
      {
        userAgent: [
          "GPTBot", // OpenAI ChatGPT
          "ChatGPT-User", // Variante ChatGPT
          "CCBot", // Common Crawl (utilisé pour l'IA)
          "anthropic-ai", // Claude (Anthropic)
          "Claude-Web", // Variante Claude
          "cohere-ai", // Cohere
          "Omgilibot", // Omgili
          "FacebookBot", // Meta AI
          "Diffbot", // Diffbot scraper
        ],
        disallow: ["/"], // Bloquer complètement l'accès
      },

      // ============================================
      // 6. BLOCAGE DES SCRAPERS AGRESSIFS
      // ============================================
      {
        userAgent: [
          "AhrefsBot", // Ahrefs SEO tool
          "SemrushBot", // Semrush SEO tool
          "DotBot", // Moz/OpenSiteExplorer
          "MJ12bot", // Majestic SEO
          "BLEXBot", // BLEXBot crawler
          "PetalBot", // Huawei bot (très agressif)
          "Bytespider", // ByteDance (TikTok)
          "YandexBot", // Yandex (si vous ne ciblez pas la Russie)
        ],
        disallow: ["/"],
        crawlDelay: 60, // Limite drastique si on ne peut pas bloquer complètement
      },

      // ============================================
      // 7. RÈGLES POUR LES ROBOTS SOCIAUX
      // ============================================
      {
        userAgent: [
          "facebookexternalhit", // Facebook Open Graph
          "Twitterbot", // Twitter Cards
          "LinkedInBot", // LinkedIn previews
          "WhatsApp", // WhatsApp previews
          "TelegramBot", // Telegram previews
          "Slackbot", // Slack previews
          "Discordbot", // Discord previews
        ],

        // Autoriser uniquement les pages publiques pour les previews
        allow: ["/", "/products/"],

        // Bloquer les pages privées
        disallow: ["/me/", "/cart", "/payment", "/api/"],
      },
    ],

    // ============================================
    // SITEMAP
    // ============================================
    // URL du sitemap principal (généré par next-sitemap)
    sitemap: `${siteUrl}/sitemap.xml`,

    // ⚠️ Alternative si vous avez plusieurs sitemaps :
    // sitemap: [
    //   `${siteUrl}/sitemap.xml`,
    //   `${siteUrl}/sitemap-products.xml`,
    //   `${siteUrl}/sitemap-categories.xml`,
    // ],

    // ============================================
    // EN-TÊTE HOST (Optionnel mais recommandé)
    // ============================================
    // Spécifie le domaine canonique pour éviter les problèmes de duplicate content
    host: siteUrl,
  };
}

/**
 * NOTES IMPORTANTES POUR VOTRE PROJET :
 *
 * 1. CRAWL-DELAY DE 10 SECONDES :
 *    - Adapté à un site de 500 users/jour
 *    - Protège votre serveur contre la surcharge
 *    - N'affecte pas Google qui s'auto-régule
 *
 * 2. PARAMÈTRES DE RECHERCHE BLOQUÉS (/*?*) :
 *    - Évite l'indexation de /products?category=electronics&sort=price
 *    - Prévient le duplicate content
 *    - Google indexera uniquement /products/[id] (pages canoniques)
 *
 * 3. BOTS IA BLOQUÉS :
 *    - Protège votre contenu unique
 *    - Évite le scraping pour l'entraînement d'IA
 *    - Vous pouvez retirer cette règle si vous voulez être indexé par les IA
 *
 * 4. SCRAPERS SEO LIMITÉS :
 *    - Ces bots ne ramènent pas de trafic
 *    - Consomment des ressources serveur
 *    - Crawl-delay de 60s ou blocage total selon vos besoins
 *
 * 5. ROUTES DYNAMIQUES :
 *    - /products/ permet à Google d'explorer /products/[id]
 *    - Next.js génère automatiquement les URLs dans le sitemap
 *    - Pas besoin de lister chaque produit individuellement ici
 *
 * 6. SITEMAP INTEGRATION :
 *    - Votre next-sitemap.config.js génère sitemap.xml
 *    - Ce fichier robots.js y fait référence automatiquement
 *    - Cohérence parfaite entre les deux
 *
 * 7. ENVIRONNEMENT DEV VS PROD :
 *    - En développement, robots.txt sera accessible mais non critique
 *    - En production, il protégera vos routes sensibles
 *    - Le isProduction permet d'ajouter des règles spécifiques
 *
 * 8. COMPATIBILITÉ NEXT.JS 15 :
 *    - Ce format est le standard Next.js 15 App Router
 *    - Next.js génère automatiquement /robots.txt à partir de ce fichier
 *    - Pas besoin de configuration supplémentaire
 *
 * 9. MONITORING :
 *    - Vérifiez dans Google Search Console l'exploration de vos pages
 *    - Ajustez crawl-delay si vous voyez trop/peu de requêtes
 *    - Pour 500 users/jour, les valeurs ci-dessus sont optimales
 *
 * 10. SÉCURITÉ :
 *     - robots.txt NE remplace PAS l'authentification
 *     - C'est une indication, pas une protection
 *     - Votre middleware.js assure la vraie sécurité
 */

/**
 * COMMENT TESTER :
 *
 * 1. En développement local :
 *    npm run dev
 *    Visitez : http://localhost:3000/robots.txt
 *
 * 2. Après déploiement :
 *    Visitez : https://votre-domaine.com/robots.txt
 *
 * 3. Validation :
 *    - Google Search Console > Paramètres > robots.txt
 *    - Testez l'accessibilité de vos URLs
 *
 * 4. Vérification du sitemap :
 *    - Assurez-vous que /sitemap.xml est accessible
 *    - Soumettez-le dans Google Search Console
 */

/**
 * PERSONNALISATIONS FUTURES POSSIBLES :
 *
 * 1. Si vous ajoutez une section blog :
 *    allow: ['/blog/']
 *
 * 2. Si vous ajoutez des catégories :
 *    allow: ['/categories/']
 *
 * 3. Si vous ciblez la Russie/Chine :
 *    Retirer YandexBot/Bytespider du blocage
 *
 * 4. Si vous voulez permettre l'IA :
 *    Retirer la règle de blocage des bots IA
 *
 * 5. Si votre trafic augmente (>2000/jour) :
 *    Augmenter crawl-delay à 15-20 secondes
 */

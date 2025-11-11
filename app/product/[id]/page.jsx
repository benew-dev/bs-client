import dynamic from "next/dynamic";

import { Suspense } from "react";
import { captureException } from "@/monitoring/sentry";
import { notFound } from "next/navigation";
import ProductLoading from "../../../components/skeletons/ProductLoading";

const ProductDetails = dynamic(
  () => import("@/components/products/ProductDetails"),
  {
    loading: () => <ProductLoading />,
    ssr: true,
  },
);

/**
 * Récupère les détails d'un produit par son ID
 * Version simplifiée et optimisée pour ~500 visiteurs/jour
 *
 * @param {string} id - L'ID MongoDB du produit
 * @returns {Promise<Object>} Détails du produit ou erreur
 */
const getProductDetails = async (id) => {
  try {
    // 1. Validation simple de l'ID MongoDB (24 caractères hexadécimaux)
    if (!id || typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) {
      console.error("Invalid product ID format:", id);
      return {
        success: false,
        message: "Format d'identifiant de produit invalide",
        notFound: true,
      };
    }

    // 2. Construire l'URL de l'API
    const apiUrl = `${process.env.API_URL || "https://bs-client-blond.vercel.app"}/api/products/${id}`;

    console.log("Fetching product details from:", apiUrl); // Log pour debug

    // 3. Faire l'appel API avec timeout raisonnable (5 secondes)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(apiUrl, {
      signal: controller.signal,
      next: {
        revalidate: 600, // Cache Next.js de 10 minutes pour un produit spécifique
        tags: ["product", `product-${id}`],
      },
    });

    clearTimeout(timeoutId);

    // 4. Vérifier le statut HTTP
    if (!res.ok) {
      // Gestion simple des erreurs principales
      if (res.status === 400) {
        return {
          success: false,
          message: "Format d'identifiant invalide",
          notFound: true,
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          message: "Produit non trouvé",
          notFound: true,
        };
      }

      // Erreur serveur générique
      console.error(`API Error: ${res.status} - ${res.statusText}`);
      return {
        success: false,
        message: "Erreur lors de la récupération du produit",
        notFound: false,
      };
    }

    // 5. Parser la réponse JSON
    const responseBody = await res.json();

    // 6. Vérifier la structure de la réponse
    if (!responseBody.success || !responseBody.data?.product) {
      console.error("Invalid API response structure:", responseBody);
      return {
        success: false,
        message: responseBody.message || "Données du produit manquantes",
        notFound: true,
      };
    }

    // 7. Retourner les données avec succès
    return {
      success: true,
      product: responseBody.data.product,
      sameCategoryProducts: responseBody.data.sameCategoryProducts || [],
      message: "Produit récupéré avec succès",
    };
  } catch (error) {
    // 8. Gestion des erreurs réseau/timeout
    if (error.name === "AbortError") {
      console.error("Request timeout after 5 seconds");
      return {
        success: false,
        message: "La requête a pris trop de temps",
        notFound: false,
      };
    }

    // Erreur réseau générique
    console.error("Network error:", error.message);
    return {
      success: false,
      message: "Problème de connexion réseau",
      notFound: false,
    };
  }
};

// Types d'erreurs personnalisés pour une meilleure gestion
class ProductNotFoundError extends Error {
  constructor(productId) {
    super(`Product with ID ${productId} not found`);
    this.name = "ProductNotFoundError";
    this.statusCode = 404;
  }
}

class ProductFetchError extends Error {
  constructor(productId, originalError) {
    super(`Failed to fetch product with ID ${productId}`);
    this.name = "ProductFetchError";
    this.cause = originalError;
    this.statusCode = 500;
  }
}

// Métadonnées dynamiques pour un meilleur SEO
export async function generateMetadata({ params }) {
  const { id } = await params;
  try {
    if (!id) {
      return {
        title: "Product Not Found | Buy It Now",
        description: "The requested product could not be found.",
      };
    }

    const data = await getProductDetails(id);
    const product = data?.product;

    if (!product) {
      return {
        title: "Product Not Found | Buy It Now",
        description: "The requested product could not be found.",
      };
    }

    return {
      title: `${product?.name} | Buy It Now`,
      description: product?.description
        ? `${product?.description.substring(0, 155)}...`
        : "Discover this amazing product on Buy It Now",
      // openGraph: {
      //   title: product?.name,
      //   type: 'product',
      //   locale: 'fr_FR',
      // },
      // Schéma JSON-LD pour produit (améliore le référencement)
      other: {
        "product-json": JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          name: product?.name,
          description: product?.description,
          image: product?.images?.[0] || "",
          offers: {
            "@type": "Offer",
            price: product?.price,
            priceCurrency: "EUR",
            availability:
              product?.stock > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }),
      },
    };
  } catch (error) {
    console.error("Error generating product metadata:", error);

    // Capturer l'erreur dans Sentry mais continuer avec des métadonnées par défaut
    captureException(error, {
      tags: {
        component: "ProductDetailsPage",
        action: "generateMetadata",
      },
    });

    return {
      title: "Product | Buy It Now",
      description: "Discover our amazing products on Buy It Now",
    };
  }
}

const ProductDetailsPage = async ({ params }) => {
  const { id } = await params;
  try {
    // Validation de l'ID
    if (!id || typeof id !== "string") {
      console.warn("Invalid product ID: missing or wrong type");
      notFound(); // 👈 REDIRECTION VERS not-found.jsx
    }

    // Sanitization basique de l'ID (à adapter selon votre format d'ID)
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      console.warn("Invalid product ID format:", id);
      notFound(); // 👈 REDIRECTION VERS not-found.jsx
    }

    const data = await getProductDetails(id);

    // 3. Vérifier si la fonction a retourné un flag notFound
    if (data?.notFound === true) {
      console.warn("Product not found:", id);
      notFound(); // 👈 REDIRECTION VERS not-found.jsx
    }

    // 4. Vérifier si le produit existe dans les données
    if (!data?.success || !data?.product) {
      console.warn("Product data missing or invalid:", id);
      notFound(); // 👈 REDIRECTION VERS not-found.jsx
    }

    return (
      <Suspense fallback={<ProductLoading />}>
        <section itemScope itemType="https://schema.org/Product">
          <meta itemProp="productID" content={id} />
          <ProductDetails
            product={data.product}
            sameCategoryProducts={data.sameCategoryProducts}
          />
        </section>
      </Suspense>
    );
  } catch (error) {
    console.error(`Error loading product ${id}:`, error);

    // Enregistrement de l'erreur dans Sentry avec contexte enrichi
    captureException(error, {
      tags: {
        component: "ProductDetailsPage",
        errorType: error.name,
        productId: params?.id,
      },
      extra: {
        message: error.message,
        statusCode: error.statusCode || 500,
      },
    });

    // Redirection vers la page 404 si le produit n'existe pas
    if (error.statusCode === 404 || error instanceof ProductNotFoundError) {
      notFound(); // Utilise la fonctionnalité Next.js pour afficher la page 404
    }

    // Les autres types d'erreurs seront capturés par error.jsx
    throw error;
  }
};

export default ProductDetailsPage;

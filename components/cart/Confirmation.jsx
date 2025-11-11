// components/cart/Confirmation.jsx
"use client";

import CartContext from "@/context/CartContext";
import OrderContext from "@/context/OrderContext";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import BreadCrumbs from "../layouts/BreadCrumbs";
import {
  CircleCheckBig,
  Banknote,
  CreditCard,
  Package,
  Info,
  Smartphone,
  Building2,
  Copy,
  CheckCircle2,
  MessageSquare,
  Phone,
} from "lucide-react";

// Configuration des plateformes de paiement
const PLATFORM_CONFIG = {
  WAAFI: {
    color: "bg-purple-100 text-purple-700 border-purple-200",
    icon: Smartphone,
    displayName: "Waafi",
  },
  "D-MONEY": {
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Smartphone,
    displayName: "D-Money",
  },
  "CAC-PAY": {
    color: "bg-green-100 text-green-700 border-green-200",
    icon: Building2,
    displayName: "CAC Pay",
  },
  "BCI-PAY": {
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Building2,
    displayName: "BCI Pay",
  },
  CASH: {
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Banknote,
    displayName: "Espèces",
  },
};

const Confirmation = () => {
  const { orderId, paymentTypes } = useContext(OrderContext);
  const { setCartToState } = useContext(CartContext);

  // ✅ NOUVEAU: État pour gérer la copie du numéro de commande
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const loadCart = async () => {
      try {
        await setCartToState();
      } catch (error) {
        console.error("Erreur lors du chargement du panier:", error);
        toast.error("Impossible de charger votre panier. Veuillez réessayer.");
      }
    };

    loadCart();
  }, [setCartToState]);

  if (orderId === undefined || orderId === null) {
    return notFound();
  }

  // ✅ NOUVEAU: Fonction pour copier le numéro de commande
  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setIsCopied(true);
      toast.success("Numéro de commande copié !", {
        position: "bottom-right",
        autoClose: 2000,
      });

      // Réinitialiser l'état après 3 secondes
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
      toast.error("Impossible de copier. Veuillez le noter manuellement.", {
        position: "bottom-right",
      });
    }
  };

  const breadCrumbs = [
    { name: "Home", url: "/" },
    { name: "Confirmation", url: "" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <BreadCrumbs breadCrumbs={breadCrumbs} />
      <div className="container max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Icône de succès */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 bg-green-100">
              <CircleCheckBig
                size={72}
                strokeWidth={1.5}
                className="text-green-600"
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Commande confirmée !
            </h1>

            {/* ✅ NOUVEAU: Instructions de paiement détaillées */}
            <div className="max-w-2xl mx-auto mb-6 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
              <div className="text-left space-y-3">
                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-blue-900">
                    📝 Votre commande a été bien enregistrée.
                  </span>
                </p>

                <p className="text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-orange-700">
                    ⚠️ Important :
                  </span>{" "}
                  Copiez et gardez précieusement ce numéro de commande.
                </p>

                <div className="bg-white/70 rounded-lg p-4 border border-blue-300">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    💳 Après le paiement de votre commande :
                  </p>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    Envoyez-nous les informations suivantes pour confirmer votre
                    paiement :
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Plateforme de paiement</strong> utilisée (ex:
                        Waafi, D-Money, CAC Pay)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Nom et numéro</strong> du compte utilisé pour le
                        paiement
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>
                        <strong>Numéro de commande</strong> (voir ci-dessous)
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/70 rounded-lg p-4 border border-green-300">
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    📬 Moyens de contact :
                  </p>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <MessageSquare size={16} className="mr-2 text-blue-600" />
                      <span>
                        Message via votre{" "}
                        <Link
                          href="/me/contact"
                          className="text-blue-600 hover:underline font-semibold"
                        >
                          espace personnel
                        </Link>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <Phone size={16} className="mr-2 text-green-600" />
                      <span>WhatsApp ou SMS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ✅ AMÉLIORATION: Numéro de commande avec bouton de copie */}
            <div className="inline-block">
              <p className="text-gray-600 mb-2">Numéro de commande :</p>
              <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-lg border-2 border-gray-300">
                <span className="font-mono font-bold text-xl text-gray-900">
                  {orderId}
                </span>
                <button
                  onClick={handleCopyOrderId}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    isCopied
                      ? "bg-green-100 text-green-600"
                      : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                  }`}
                  title={isCopied ? "Copié !" : "Copier le numéro"}
                >
                  {isCopied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Informations de paiement */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Moyens de paiement disponibles
                </h2>
                <p className="text-sm text-gray-600">
                  Utilisez l&apos;un de ces moyens pour effectuer votre paiement
                </p>
              </div>
            </div>

            {paymentTypes && paymentTypes.length > 0 ? (
              <div className="flex flex-col gap-4">
                {paymentTypes.map((payment, index) => {
                  const config = PLATFORM_CONFIG[payment?.platform] || {
                    color: "bg-gray-100 text-gray-700 border-gray-200",
                    icon: CreditCard,
                    displayName: payment?.platform || "Inconnu",
                  };
                  const IconComponent = config.icon;
                  const isCash =
                    payment?.platform === "CASH" || payment?.isCashPayment;

                  return (
                    <div
                      key={payment._id || index}
                      className="group relative p-5 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex items-center gap-6">
                        {/* Icône de la plateforme */}
                        <div
                          className={`flex-shrink-0 p-4 rounded-xl ${config.color} border-2`}
                        >
                          <IconComponent className="w-8 h-8" />
                        </div>

                        {/* Contenu principal - responsive */}
                        <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          {/* Section gauche - Nom de la plateforme */}
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {config.displayName}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${config.color} border`}
                            >
                              Disponible
                            </span>
                          </div>

                          {/* Section droite - Informations de paiement */}
                          {isCash ? (
                            <div className="flex items-center gap-2">
                              <div className="px-4 py-2 bg-emerald-50 rounded-lg border border-emerald-200">
                                <p className="text-sm text-emerald-700 font-medium">
                                  Paiement à la livraison
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                              {/* Titulaire */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase">
                                  Titulaire:
                                </span>
                                <span className="font-semibold text-gray-900">
                                  {payment?.paymentName ||
                                    payment?.name ||
                                    "Non renseigné"}
                                </span>
                              </div>

                              {/* Séparateur */}
                              <div className="hidden sm:block w-px h-8 bg-gray-300"></div>

                              {/* Numéro */}
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-500 uppercase">
                                  N°:
                                </span>
                                <span className="font-mono font-bold text-gray-900">
                                  {payment?.paymentNumber ||
                                    payment?.number ||
                                    "Non renseigné"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Indicateur hover */}
                      <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-r-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <CreditCard className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">
                      Aucune information de paiement disponible
                    </p>
                    <p className="text-sm text-yellow-700">
                      Veuillez contacter le support pour plus
                      d&apos;informations.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Informations générales */}
            <div className="mt-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Package
                    className="mr-3 text-blue-600 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">
                      Prochaines étapes
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                      <li>Nous préparons votre commande</li>
                      <li>
                        Effectuez le paiement via l&apos;un des moyens ci-dessus
                      </li>
                      <li>
                        Envoyez-nous la confirmation de paiement avec le numéro
                        de commande
                      </li>
                      <li>Vous serez contacté une fois la commande prête</li>
                      <li>Récupérez votre commande au point de retrait</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info
                    className="mr-3 text-amber-600 flex-shrink-0 mt-0.5"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Important:</span> Effectuez
                      le paiement vers l&apos;un des comptes indiqués ci-dessus.
                      Votre commande sera traitée une fois le paiement confirmé
                      et les informations envoyées.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/me/contact"
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-center font-medium transition-colors flex items-center justify-center gap-2"
            >
              <MessageSquare size={20} />
              Envoyer confirmation de paiement
            </Link>

            <Link
              href="/me/orders"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center font-medium transition-colors"
            >
              Voir mes commandes
            </Link>

            <Link
              href="/"
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center font-medium transition-colors"
            >
              Continuer mes achats
            </Link>
          </div>

          {/* Informations de contact */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              Des questions ? Consultez notre{" "}
              <Link
                href="/me/contact"
                className="text-blue-600 hover:underline"
              >
                page de contact
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;

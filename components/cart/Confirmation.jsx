// components/cart/Confirmation.jsx
"use client";

import CartContext from "@/context/CartContext";
import OrderContext from "@/context/OrderContext";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useContext, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import BreadCrumbs from "../layouts/BreadCrumbs";
import {
  CircleCheckBig,
  Banknote,
  CreditCard,
  Package,
  Info,
} from "lucide-react";

const Confirmation = () => {
  const { orderId, orderInfo, paymentTypes } = useContext(OrderContext);
  const { setCartToState } = useContext(CartContext);

  // Déterminer si c'est un paiement CASH
  const isCashPayment = useMemo(() => {
    return (
      orderInfo?.paymentInfo?.typePayment === "CASH" ||
      orderInfo?.paymentInfo?.isCashPayment === true
    );
  }, [orderInfo]);

  // Récupérer les informations de la plateforme de paiement
  const paymentPlatformInfo = useMemo(() => {
    if (!paymentTypes || !orderInfo?.paymentInfo?.typePayment) return null;

    return paymentTypes.find(
      (pt) => pt.platform === orderInfo.paymentInfo.typePayment,
    );
  }, [paymentTypes, orderInfo]);

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

  const breadCrumbs = [
    { name: "Home", url: "/" },
    { name: "Confirmation", url: "" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <BreadCrumbs breadCrumbs={breadCrumbs} />
      <div className="container max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-8">
          {/* Icône de succès avec couleur adaptée */}
          <div className="text-center mb-8">
            <div
              className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                isCashPayment ? "bg-green-100" : "bg-blue-100"
              }`}
            >
              <CircleCheckBig
                size={72}
                strokeWidth={1.5}
                className={isCashPayment ? "text-green-600" : "text-blue-600"}
              />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Commande confirmée !
            </h1>

            <p className="text-gray-600">
              Numéro de commande :{" "}
              <span className="font-mono font-semibold">{orderId}</span>
            </p>
          </div>

          {/* Message de confirmation adapté au type de paiement */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            {isCashPayment ? (
              // Message pour paiement CASH
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Banknote
                      className="mr-3 text-green-600 flex-shrink-0 mt-0.5"
                      size={24}
                    />
                    <div>
                      <h3 className="font-semibold text-green-800 mb-2">
                        Paiement en espèces à la récupération
                      </h3>
                      <p className="text-sm text-green-700 mb-2">
                        Votre commande a été enregistrée avec succès. Vous
                        paierez en espèces lors de la récupération de votre
                        commande.
                      </p>
                    </div>
                  </div>
                </div>

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
                        <li>Vous serez contacté une fois la commande prête</li>
                        <li>Préparez le montant exact en espèces</li>
                        <li>Récupérez votre commande et payez sur place</li>
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
                        <span className="font-medium">Important:</span>{" "}
                        Assurez-vous d&apos;avoir le montant exact en espèces
                        lors de la récupération pour faciliter la transaction.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              // Message pour paiement électronique avec infos plateforme
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CreditCard
                      className="mr-3 text-blue-600 flex-shrink-0 mt-0.5"
                      size={20}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-800 mb-2">
                        Informations de paiement
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        Votre commande a été enregistrée avec succès. Veuillez
                        effectuer le paiement via la plateforme sélectionnée.
                      </p>

                      {/* Affichage des informations de la plateforme */}
                      {paymentPlatformInfo && (
                        <div className="mt-3 pt-3 border-t border-blue-300 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Plateforme:</span>
                            <span className="font-semibold text-blue-900">
                              {paymentPlatformInfo.platform}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">
                              Nom du compte:
                            </span>
                            <span className="font-medium text-blue-900">
                              {paymentPlatformInfo.paymentName ||
                                paymentPlatformInfo.name}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-blue-700">Numéro:</span>
                            <span className="font-mono font-medium text-blue-900">
                              {paymentPlatformInfo.paymentNumber ||
                                paymentPlatformInfo.number}
                            </span>
                          </div>
                        </div>
                      )}
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
                        <span className="font-medium">Important:</span>{" "}
                        Effectuez le paiement vers le compte indiqué ci-dessus.
                        Votre commande sera traitée une fois le paiement
                        confirmé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/me/orders"
              className={`flex-1 px-6 py-3 text-white rounded-md text-center font-medium transition-colors ${
                isCashPayment
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
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
              <Link href="/contact" className="text-blue-600 hover:underline">
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

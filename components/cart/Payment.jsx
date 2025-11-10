"use client";

import {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { captureException } from "@/monitoring/sentry";

// Imports optimisés
import CartContext from "@/context/CartContext";
import OrderContext from "@/context/OrderContext";
import { isArrayEmpty, formatPrice, safeValue } from "@/helpers/helpers";
import PaymentPageSkeleton from "../skeletons/PaymentPageSkeleton";
import { validateDjiboutiPayment } from "@/helpers/validation";
import {
  HandCoins,
  Info,
  LoaderCircle,
  ShoppingCart,
  Banknote,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import ItemShipping from "./components/ItemShipping";

// Chargement dynamique des composants
const BreadCrumbs = dynamic(() => import("@/components/layouts/BreadCrumbs"), {
  loading: () => <div className="h-12 animate-pulse bg-gray-200 rounded"></div>,
  ssr: true,
});

// Squelette pour chargement des items
const CartItemSkeleton = memo(() => (
  <div className="animate-pulse">
    <div className="flex items-center mb-4">
      <div className="w-20 h-20 rounded bg-gray-200"></div>
      <div className="ml-4 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-32"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    </div>
  </div>
));
CartItemSkeleton.displayName = "CartItemSkeleton";

/**
 * Composant de paiement
 * Permet à l'utilisateur de sélectionner un moyen de paiement local (y compris CASH) et finaliser sa commande
 */
const Payment = ({ paymentTypes }) => {
  // États locaux
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [errors, setErrors] = useState({});
  const [dataInitialized, setDataInitialized] = useState(false);

  // ✅ NOUVEAUX ÉTATS pour la validation en temps réel
  const [nameValid, setNameValid] = useState(null);
  const [numberValid, setNumberValid] = useState(null);

  // Référence pour limiter les soumissions multiples
  const submitAttempts = useRef(0);

  // Contextes
  const { cart, cartTotal, cartCount } = useContext(CartContext);

  const { orderInfo, setOrderInfo, setPaymentTypes, error, clearErrors } =
    useContext(OrderContext);

  const router = useRouter();

  // Vérifier si le paiement sélectionné est CASH
  const isCashPayment = useMemo(() => {
    return (
      selectedPayment?.platform === "CASH" || selectedPayment?.isCashPayment
    );
  }, [selectedPayment]);

  // Calcul du montant total
  const totalAmount = useMemo(() => {
    return Number(safeValue(cartTotal?.toFixed(2), 0));
  }, [cartTotal]);

  // Chemins de fil d'Ariane
  const breadCrumbs = useMemo(() => {
    const steps = [
      { name: "Accueil", url: "/" },
      { name: "Panier", url: "/cart" },
    ];

    steps.push({ name: "Paiement", url: "" });

    return steps;
  }, []);

  // Initialisation des données et validation
  useEffect(() => {
    const initializePaymentPage = async () => {
      try {
        setIsLoading(true);

        // Préparation des éléments de commande
        const orderItems = prepareOrderItems();
        setOrderInfo({ orderItems });

        // Précharger la page de confirmation
        router.prefetch("/confirmation");

        // Vérifier que les infos nécessaires sont présentes
        if (!cartTotal || cartTotal < 0 || cartCount < 0) {
          toast.error("Informations de commande incomplètes", {
            position: "bottom-right",
            autoClose: 5000,
          });
          return router.push("/cart");
        }

        // Vérifier si des moyens de paiement sont disponibles
        if (isArrayEmpty(paymentTypes)) {
          toast.error("Aucun moyen de paiement n'est disponible actuellement", {
            position: "bottom-right",
            autoClose: 5000,
          });
        }

        setDataInitialized(true);
      } catch (error) {
        console.error(
          "Erreur lors de l'initialisation de la page de paiement:",
          error,
        );
        captureException(error, {
          tags: { component: "Payment", action: "initializePaymentPage" },
        });

        toast.error(
          "Une erreur est survenue lors du chargement des options de paiement",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (!dataInitialized) {
      initializePaymentPage();
    }
  }, [
    paymentTypes,
    dataInitialized,
    cartTotal,
    cartCount,
    router,
    setOrderInfo,
  ]);

  // Handle auth context updates
  useEffect(() => {
    if (error) {
      toast.error(error);
      clearErrors();
    }
  }, [error, clearErrors]);

  // Réinitialiser les champs quand on sélectionne CASH
  useEffect(() => {
    if (isCashPayment) {
      setAccountName("");
      setAccountNumber("");
      setErrors({});
      setNameValid(null);
      setNumberValid(null);
    }
  }, [isCashPayment]);

  // Fonction pour préparer les éléments de commande
  const prepareOrderItems = useCallback(() => {
    if (!Array.isArray(cart)) return [];

    return cart.map((item) => ({
      cartId: item?.id,
      product: item?.productId,
      name: item?.productName || "Produit sans nom",
      category: "Non catégorisé",
      quantity: item?.quantity || 1,
      price: item?.price,
      image: item?.imageUrl || "/images/default_product.png",
      subtotal: Number(item?.subtotal),
    }));
  }, [cart]);

  // ✅ CORRECTION: Ne plus utiliser trim() pendant la saisie
  const handleAccountNameChange = useCallback((e) => {
    const value = e.target.value; // Pas de trim ici !
    setAccountName(value);

    // ✅ Validation en temps réel
    if (value.length === 0) {
      setNameValid(null);
      setErrors((prev) => ({ ...prev, accountName: undefined }));
    } else {
      const trimmedValue = value.trim();
      const nameWords = trimmedValue.split(/\s+/);
      const isValid =
        nameWords.length >= 2 && nameWords.every((w) => w.length >= 2);
      setNameValid(isValid);

      if (!isValid && trimmedValue.length > 0) {
        setErrors((prev) => ({
          ...prev,
          accountName:
            "Prénom et nom complets requis (min 2 caractères chacun)",
        }));
      } else {
        setErrors((prev) => ({ ...prev, accountName: undefined }));
      }
    }
  }, []);

  // ✅ AMÉLIORATION: Validation en temps réel pour le numéro
  const handleAccountNumberChange = useCallback((e) => {
    const rawValue = e.target.value.replace(/[^\d]/g, "");
    setAccountNumber(rawValue);

    // ✅ Validation en temps réel
    if (rawValue.length === 0) {
      setNumberValid(null);
      setErrors((prev) => ({ ...prev, accountNumber: undefined }));
    } else {
      // Validation pour numéro djiboutien
      const isDjiboutiFormat = /^77[0-9]{6}$/.test(rawValue);

      if (isDjiboutiFormat) {
        // Vérifier que ce n'est pas un numéro simple
        const isSimpleNumber = /(77000000|77111111|77123456|77654321)/.test(
          rawValue,
        );
        setNumberValid(!isSimpleNumber);

        if (isSimpleNumber) {
          setErrors((prev) => ({ ...prev, accountNumber: "Numéro invalide" }));
        } else {
          setErrors((prev) => ({ ...prev, accountNumber: undefined }));
        }
      } else if (rawValue.length >= 4 && rawValue.length <= 30) {
        // Validation pour autres types de paiement
        const isAllZeros = /^0+$/.test(rawValue);
        const isRepeating = /^(\d)\1+$/.test(rawValue);
        const isValid = !isAllZeros && !isRepeating;

        setNumberValid(isValid);

        if (!isValid) {
          setErrors((prev) => ({
            ...prev,
            accountNumber: "Numéro de compte invalide",
          }));
        } else {
          setErrors((prev) => ({ ...prev, accountNumber: undefined }));
        }
      } else if (rawValue.length < 4) {
        setNumberValid(false);
        setErrors((prev) => ({
          ...prev,
          accountNumber: "Minimum 4 chiffres requis",
        }));
      } else {
        setNumberValid(false);
        setErrors((prev) => ({
          ...prev,
          accountNumber: "Maximum 30 chiffres autorisés",
        }));
      }
    }
  }, []);

  const handlePaymentChange = useCallback((payment) => {
    setSelectedPayment(payment);
    // Réinitialiser les validations quand on change de moyen de paiement
    setNameValid(null);
    setNumberValid(null);
    setErrors({});
  }, []);

  // Fonction d'adaptation pour mapper tes champs vers le schéma existant
  const mapToPaymentSchema = (platform, accountName, accountNumber) => {
    return {
      paymentPlatform: platform?.toLowerCase().replace(/[\s-]/g, "-"),
      accountHolderName: accountName,
      phoneNumber: accountNumber,
    };
  };

  const validatePaymentData = async () => {
    // Si c'est un paiement CASH, pas besoin de valider les champs
    if (isCashPayment) {
      return { isValid: true, data: { isCashPayment: true } };
    }

    // ✅ AMÉLIORATION: Utiliser trim() uniquement lors de la validation
    const trimmedName = accountName.trim();
    const cleanNumber = accountNumber.replace(/\D/g, "");

    // Validation universelle pour les paiements électroniques
    if (!selectedPayment || !trimmedName || !cleanNumber) {
      return {
        isValid: false,
        errors: { general: "Tous les champs sont requis" },
      };
    }

    // Validation du nom (toujours requise pour paiements électroniques)
    const nameWords = trimmedName.split(/\s+/);
    if (nameWords.length < 2 || nameWords.some((w) => w.length < 2)) {
      return {
        isValid: false,
        errors: { accountName: "Prénom et nom complets requis" },
      };
    }

    // Validation selon le type de compte
    let validationPassed = false;

    // Si c'est un numéro djiboutien (77XXXXXX)
    if (cleanNumber.match(/^77[0-9]{6}$/)) {
      const paymentData = mapToPaymentSchema(
        selectedPayment.platform,
        trimmedName,
        cleanNumber,
      );

      const validationResult = await validateDjiboutiPayment(paymentData);

      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors);
        errorMessages.forEach((msg) => {
          toast.error(msg, { position: "bottom-right" });
        });
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }
      validationPassed = true;
    } else {
      // Validation pour TOUS les autres types de paiement
      if (cleanNumber.length < 4 || cleanNumber.length > 30) {
        toast.error(
          "Le numéro de compte doit contenir entre 4 et 30 chiffres",
          {
            position: "bottom-right",
          },
        );
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      if (/^0+$/.test(cleanNumber) || /^(\d)\1+$/.test(cleanNumber)) {
        toast.error("Numéro de compte invalide", {
          position: "bottom-right",
        });
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      validationPassed = true;
    }

    if (!validationPassed) {
      toast.error("Validation échouée", { position: "bottom-right" });
      setIsSubmitting(false);
      submitAttempts.current = 0;
      return;
    }

    return {
      isValid: true,
      data: { accountName: trimmedName, accountNumber: cleanNumber },
    };
  };

  const handlePayment = useCallback(async () => {
    submitAttempts.current += 1;
    if (submitAttempts.current > 1) {
      setTimeout(() => {
        submitAttempts.current = 0;
      }, 5000);
      return toast.info("Traitement en cours, veuillez patienter...", {
        position: "bottom-right",
      });
    }

    try {
      setIsSubmitting(true);

      // Vérifier qu'un moyen de paiement est sélectionné
      if (!selectedPayment) {
        toast.error("Veuillez sélectionner un moyen de paiement", {
          position: "bottom-right",
        });
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      const validationResult = await validatePaymentData();
      if (!validationResult.isValid) {
        const errorMessages = Object.values(validationResult.errors || {});
        errorMessages.forEach((msg) =>
          toast.error(msg, { position: "bottom-right" }),
        );
        setIsSubmitting(false);
        submitAttempts.current = 0;
        return;
      }

      // Création des informations de paiement avec le nouveau modèle
      const paymentInfo = {
        typePayment: selectedPayment.platform,
        paymentAccountNumber: isCashPayment ? "CASH" : accountNumber,
        paymentAccountName: isCashPayment
          ? "Paiement en espèces"
          : accountName.trim(),
        paymentDate: new Date().toISOString(),
        isCashPayment: isCashPayment,
      };

      const finalOrderInfo = {
        ...orderInfo,
        paymentInfo,
        totalAmount: totalAmount,
      };

      setPaymentTypes(paymentTypes);

      setOrderInfo(finalOrderInfo);
      router.push("/review-order");

      setSelectedPayment(null);
      setAccountName("");
      setAccountNumber("");
    } catch (error) {
      console.error("Erreur lors du traitement du paiement:", error);
      captureException(error, {
        tags: { component: "Payment", action: "handlePayment" },
        extra: {
          hasOrderInfo: !!orderInfo,
          hasPaymentType: !!selectedPayment,
        },
      });

      toast.error(
        error.message ||
          "Une erreur est survenue lors du traitement du paiement",
        {
          position: "bottom-right",
          autoClose: 5000,
        },
      );
    } finally {
      setIsSubmitting(false);
      submitAttempts.current = 0;
    }
  }, [
    selectedPayment,
    accountName,
    accountNumber,
    totalAmount,
    orderInfo,
    setOrderInfo,
    router,
    isCashPayment,
    setPaymentTypes,
    paymentTypes,
  ]);

  if (isLoading) {
    return <PaymentPageSkeleton />;
  }

  if (!cart || !Array.isArray(cart) || cartCount === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-blue-50 rounded-full p-6 mb-6">
            <ShoppingCart size={72} strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold mb-3">Votre panier est vide</h2>
          <p className="text-gray-600 mb-6 max-w-md">
            Vous devez ajouter des produits à votre panier avant de procéder au
            paiement.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md shadow hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Découvrir nos produits
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <BreadCrumbs breadCrumbs={breadCrumbs} />

      <section className="py-8 md:py-10">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6">
            <main className="md:w-2/3">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-6 pb-2 border-b">
                  Choisissez votre moyen de paiement
                </h2>

                {isArrayEmpty(paymentTypes) ? (
                  <NoPaymentMethodsFound />
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    {paymentTypes?.map((payment) => (
                      <PaymentMethodCard
                        key={payment?._id}
                        payment={payment}
                        isSelected={selectedPayment?._id === payment?._id}
                        onSelect={handlePaymentChange}
                      />
                    ))}
                  </div>
                )}

                {/* ✅ NOUVEAU: Message d'aide contextuel pour CASH */}
                {isCashPayment && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <Banknote
                        className="mr-3 text-green-600 flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <div>
                        <h3 className="font-semibold text-green-800 mb-1">
                          Paiement en espèces
                        </h3>
                        <p className="text-sm text-green-700 mb-2">
                          Vous paierez en espèces lors de la récupération de
                          votre commande. Aucune information de compte
                          n&apos;est requise.
                        </p>
                        <p className="text-xs text-green-600">
                          💡 Préparez le montant exact pour faciliter la
                          transaction
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ✅ NOUVEAU: Message d'aide contextuel pour paiement électronique */}
                {selectedPayment && !isCashPayment && (
                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start">
                      <Info
                        className="mr-3 text-blue-600 flex-shrink-0 mt-0.5"
                        size={20}
                      />
                      <div className="text-sm text-blue-700 space-y-2">
                        <h3 className="font-semibold text-blue-800">
                          Informations de votre compte{" "}
                          {selectedPayment.platform}
                        </h3>
                        <p>
                          <strong>Important :</strong> Renseignez le nom et le
                          numéro du compte{" "}
                          <strong>
                            depuis lequel vous allez envoyer l&apos;argent
                          </strong>
                          .
                        </p>
                        <div className="bg-white/50 rounded p-3 mt-2 border border-blue-200">
                          <p className="font-medium text-blue-800 mb-1">
                            💳 Vous devez envoyer le paiement à :
                          </p>
                          <p className="text-blue-900">
                            <span className="font-semibold">Nom :</span>{" "}
                            {selectedPayment.name}
                          </p>
                          <p className="text-blue-900">
                            <span className="font-semibold">Numéro :</span>{" "}
                            {selectedPayment.number}
                          </p>
                        </div>
                        <p className="text-xs text-blue-600 mt-2">
                          ℹ️ Ces informations permettront au vendeur de vérifier
                          votre paiement rapidement
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Message de sécurité général */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-200">
                  <p className="flex items-start">
                    <Info
                      className="mr-2 flex-shrink-0 mt-0.5 text-gray-500"
                      size={16}
                    />
                    <span>
                      Cette transaction est sécurisée. Vos informations de
                      paiement ne sont pas stockées et sont transmises de
                      manière cryptée.
                    </span>
                  </p>
                </div>
              </div>
            </main>

            <aside className="md:w-1/3">
              <div className="bg-white shadow rounded-lg p-6 sticky top-24">
                <h2 className="font-semibold text-lg mb-6 pb-2 border-b">
                  Finaliser votre paiement
                </h2>

                {!isCashPayment && selectedPayment && (
                  <div className="space-y-4 mb-6">
                    {/* ✅ AMÉLIORATION: Label plus explicite */}
                    <div className="form-group">
                      <label className="block text-gray-700 mb-1 font-medium text-sm">
                        Votre nom complet{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none transition-colors ${
                            errors.accountName
                              ? "border-red-300 bg-red-50"
                              : nameValid === true
                                ? "border-green-300 bg-green-50"
                                : nameValid === false
                                  ? "border-orange-300 bg-orange-50"
                                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
                          }`}
                          type="text"
                          placeholder="Ex: Jean Dupont"
                          value={accountName}
                          onChange={handleAccountNameChange}
                          aria-invalid={errors.accountName ? "true" : "false"}
                          required
                        />
                        {/* ✅ NOUVEAU: Icône de validation */}
                        {nameValid === true && (
                          <CheckCircle2
                            className="absolute right-3 top-2.5 text-green-600"
                            size={20}
                          />
                        )}
                        {nameValid === false && accountName.length > 0 && (
                          <AlertCircle
                            className="absolute right-3 top-2.5 text-orange-600"
                            size={20}
                          />
                        )}
                      </div>
                      {errors.accountName && (
                        <p className="mt-1 text-red-500 text-xs flex items-start">
                          <AlertCircle
                            className="mr-1 flex-shrink-0 mt-0.5"
                            size={12}
                          />
                          {errors.accountName}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        Le nom sur votre compte {selectedPayment.platform}
                      </p>
                    </div>

                    {/* ✅ AMÉLIORATION: Label et aide contextuelle */}
                    <div className="form-group">
                      <label className="block text-gray-700 mb-1 font-medium text-sm">
                        Votre numéro de compte{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full px-3 py-2 pr-10 border rounded-md focus:ring focus:ring-blue-200 focus:outline-none transition-colors ${
                            errors.accountNumber
                              ? "border-red-300 bg-red-50"
                              : numberValid === true
                                ? "border-green-300 bg-green-50"
                                : numberValid === false
                                  ? "border-orange-300 bg-orange-50"
                                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
                          }`}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          placeholder={
                            selectedPayment.platform === "WAAFI" ||
                            selectedPayment.platform === "D-MONEY"
                              ? "Ex: 77123456"
                              : "Ex: 1234567890"
                          }
                          value={accountNumber}
                          onChange={handleAccountNumberChange}
                          aria-invalid={errors.accountNumber ? "true" : "false"}
                          autoComplete="off"
                          maxLength="30"
                          required
                        />
                        {/* ✅ NOUVEAU: Icône de validation */}
                        {numberValid === true && (
                          <CheckCircle2
                            className="absolute right-3 top-2.5 text-green-600"
                            size={20}
                          />
                        )}
                        {numberValid === false && accountNumber.length > 0 && (
                          <AlertCircle
                            className="absolute right-3 top-2.5 text-orange-600"
                            size={20}
                          />
                        )}
                      </div>
                      {errors.accountNumber && (
                        <p className="mt-1 text-red-500 text-xs flex items-start">
                          <AlertCircle
                            className="mr-1 flex-shrink-0 mt-0.5"
                            size={12}
                          />
                          {errors.accountNumber}
                        </p>
                      )}
                      <div className="mt-1 text-xs text-gray-500">
                        {selectedPayment.platform === "WAAFI" ||
                        selectedPayment.platform === "D-MONEY" ? (
                          <p>Format: 77XXXXXX (8 chiffres)</p>
                        ) : (
                          <p>Entre 4 et 30 chiffres</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {isCashPayment && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      Aucune information de paiement requise pour le paiement en
                      espèces
                    </p>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-lg font-bold border-t pt-3 mt-2">
                    <span>Total à payer:</span>
                    <span className="text-blue-600">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-3">
                  <Link
                    href="/cart"
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 shadow-sm"
                  >
                    Retour
                  </Link>

                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={
                      isSubmitting ||
                      !selectedPayment ||
                      (!isCashPayment && (!nameValid || !numberValid))
                    }
                    className={`flex-1 px-5 py-2 text-white rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      isSubmitting ||
                      !selectedPayment ||
                      (!isCashPayment && (!nameValid || !numberValid))
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700 focus:ring-green-500"
                    }`}
                    aria-live="polite"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center">
                        <LoaderCircle className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                        Traitement...
                      </span>
                    ) : isCashPayment ? (
                      "Confirmer la commande"
                    ) : (
                      "Payer"
                    )}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="font-medium text-gray-800 mb-3">
                    Produits ({Array.isArray(cart) ? cartCount : 0})
                  </h3>

                  <div className="space-y-3 max-h-80 overflow-auto pr-2 hide-scrollbar">
                    {Array.isArray(cart) && cartCount > 0 ? (
                      cart.map((item) => (
                        <ItemShipping key={item.id || item._id} item={item} />
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm italic py-2">
                        Aucun produit dans votre panier
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

const NoPaymentMethodsFound = memo(() => (
  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
    <HandCoins className="mx-auto mb-4" size={48} />
    <p className="font-semibold text-lg mb-2">
      Aucun moyen de paiement disponible
    </p>
    <p className="text-gray-600 mb-4 px-4">
      Nos moyens de paiement sont temporairement indisponibles. Veuillez
      réessayer plus tard.
    </p>
    <Link
      href="/cart"
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm"
    >
      Retour au panier
    </Link>
  </div>
));
NoPaymentMethodsFound.displayName = "NoPaymentMethodsFound";

const PaymentMethodCard = memo(({ payment, isSelected, onSelect }) => {
  const platformColors = {
    WAAFI: "from-blue-500 to-blue-600",
    "D-MONEY": "from-purple-500 to-purple-600",
    "CAC-PAY": "from-green-500 to-green-600",
    "BCI-PAY": "from-orange-500 to-orange-600",
    CASH: "from-gray-700 to-gray-800",
  };

  const colorScheme =
    platformColors[payment?.platform] || "from-emerald-500 to-green-600";

  const isCash = payment?.platform === "CASH" || payment?.isCashPayment;

  return (
    <label
      className={`flex flex-col p-4 border rounded-lg transition-all duration-200 cursor-pointer ${
        isSelected
          ? "bg-blue-50 border-blue-400 shadow-sm"
          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
      }`}
    >
      <span className="flex items-center mb-3">
        <input
          name="payment"
          type="radio"
          value={payment?._id}
          checked={isSelected}
          onChange={() => onSelect(payment)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
        />
        <div className="ml-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-white text-sm font-bold bg-gradient-to-r ${colorScheme}`}
          >
            {isCash && <Banknote className="mr-1" size={16} />}
            {payment?.platform}
          </span>
        </div>
      </span>
      <div className="ml-7 space-y-1">
        {isCash ? (
          <div className="text-sm text-gray-600">
            <p className="font-medium">
              Paiement en espèces lors de la récupération
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Aucune information de compte requise
            </p>
          </div>
        ) : (
          <>
            {/* ✅ AMÉLIORATION: Présentation plus claire des infos de paiement */}
            <div className="bg-gray-50 p-2 rounded border border-gray-200">
              <p className="text-xs text-gray-500 mb-1">
                Envoyez votre paiement à :
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <div className="flex items-start">
                  <span className="font-medium min-w-[60px]">Nom:</span>
                  <span className="text-gray-900">{payment?.name}</span>
                </div>
                <div className="flex items-start">
                  <span className="font-medium min-w-[60px]">Numéro:</span>
                  <span className="text-gray-900 font-mono">
                    {payment?.number}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </label>
  );
});
PaymentMethodCard.displayName = "PaymentMethodCard";

export default Payment;

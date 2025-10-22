import mongoose from "mongoose";

const paymentTypeSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: [true, "La plateforme de paiement est requise"],
    enum: {
      values: ["WAAFI", "D-MONEY", "CAC-PAY", "BCI-PAY"],
      message: "Type de paiement non supporté: {VALUE}",
    },
  },
  paymentName: {
    type: String,
    required: [true, "Le nom du titulaire du compte est requis"],
  },
  paymentNumber: {
    type: String,
    required: [true, "Le numéro de compte est requis"],
  },
});

export default mongoose.models.PaymentType ||
  mongoose.model("PaymentType", paymentTypeSchema);

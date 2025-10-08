import mongoose from "mongoose";

const paymentTypeSchema = new mongoose.Schema({
  paymentName: {
    type: String,
    required: true,
    enum: {
      values: ["WAAFI", "D-MONEY", "CAC-PAY", "BCI-PAY"],
      message: "Type de paiement non supporté: {VALUE}",
    },
  },
  paymentNumber: {
    type: String,
    required: true,
  },
});

export default mongoose.models.PaymentType ||
  mongoose.model("PaymentType", paymentTypeSchema);

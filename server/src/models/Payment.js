import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ["COD", "UPI", "Card"], required: true },
  transactionId: String,
  status: { type: String, enum: ["pending", "success", "completed", "failed"], default: "pending" }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);

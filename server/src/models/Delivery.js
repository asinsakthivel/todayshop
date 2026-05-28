import mongoose from "mongoose";

const deliveryStatusSchema = new mongoose.Schema({
  status: String,
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const deliverySchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  pickupAddress: String,
  dropAddress: String,
  currentStatus: { type: String, default: "pending" },
  statusHistory: [deliveryStatusSchema],
  earnings: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("Delivery", deliverySchema);

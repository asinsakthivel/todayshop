import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, maxlength: 500 },
  reviewedFor: {
    seller: { type: Boolean, default: false },
    delivery: { type: Boolean, default: false }
  }
}, { timestamps: true });

// Unique review per order-buyer-seller
reviewSchema.index({ orderId: 1, buyerId: 1, sellerId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);

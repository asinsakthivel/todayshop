import mongoose from "mongoose";

const deliveryReviewSchema = new mongoose.Schema({
  deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: "Delivery", required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  review: { type: String, maxlength: 500 },
  deliveryExperience: { 
    type: String, 
    enum: ["excellent", "good", "average", "poor"],
    default: "good"
  }
}, { timestamps: true });

// Ensure only one review per order from a buyer
deliveryReviewSchema.index({ orderId: 1, buyerId: 1 }, { unique: true });

export default mongoose.model("DeliveryReview", deliveryReviewSchema);
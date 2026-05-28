import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  rating: { type: Number, default: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  costPrice: Number,
  discountPrice: Number,
  category: {
    type: String,
    required: true,
    index: true,
    enum: [
      "Produce",
      "Dairy",
      "Meat/Seafood",
      "Bakery",
      "Frozen",
      "Pantry/Dry Goods",
      "Beverages",
      "Household Essentials"
    ],
  },

  shopName: { type: String, trim: true },
  images: [{ type: String }],
  stockQuantity: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
  approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  approvalNote: { type: String, default: "" },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  reviews: [reviewSchema]
}, { timestamps: true });

export default mongoose.model("Product", productSchema);

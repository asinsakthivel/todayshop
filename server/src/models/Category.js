import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    required: true
  },

  price: {
    type: Number,
    required: true
  },

  costPrice: {
    type: Number,
    default: 0
  },

  discountPrice: Number,

  category: {
    type: String,
    required: true,
    index: true,
    trim: true
  },

  shopName: {
    type: String,
    trim: true
  },

  images: [{ type: String }],

  stockQuantity: {
    type: Number,
    required: true,
    min: 0
  },

  isAvailable: {
    type: Boolean,
    default: true
  },

  avgRating: {
    type: Number,
    default: 0
  },

  reviewCount: {
    type: Number,
    default: 0
  },

  reviews: [mongoose.Schema.Types.Mixed]
}, { timestamps: true });

const Category = mongoose.model("Category", productSchema);

export default Category;

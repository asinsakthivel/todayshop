import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1, min: 1 },
  price: { type: Number, required: true }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [cartItemSchema]
}, { timestamps: { createdAt: true, updatedAt: true } });

const Cart = mongoose.models.Cart || mongoose.model("Cart", cartSchema);

export const ensureCartIndexes = async () => {
  try {
    const indexes = await Cart.collection.indexes();
    const legacyUserIndex = indexes.find((index) => index.name === "user_1");

    if (legacyUserIndex) {
      await Cart.collection.dropIndex("user_1");
      console.warn("Dropped legacy carts.user_1 index");
    }

    await Cart.syncIndexes();
  } catch (error) {
    console.error("Failed to ensure cart indexes");
    console.error(error.message);
    throw error;
  }
};

export default Cart;

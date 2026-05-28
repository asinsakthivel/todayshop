import Cart from "../models/Cart.js";

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ buyerId: req.user.id }).populate("items.productId");
  res.json(cart || { buyerId: req.user.id, items: [] });
};

export const setCart = async (req, res) => {
  const { items = [] } = req.body;
  const cart = await Cart.findOneAndUpdate(
    { buyerId: req.user.id },
    { buyerId: req.user.id, items },
    { new: true, upsert: true }
  ).populate("items.productId");
  res.json(cart);
};

import User from "../models/User.js";
import Address from "../models/Address.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import { sendEmail } from "../utils/sendEmail.js";
import { DELIVERY_CHARGE, formatAddress, toOrderSummary } from "../utils/orderPresentation.js";

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
  res.json(updated);
};

export const getAddresses = async (req, res) => {
  const addresses = await Address.find({ buyerId: req.user.id }).sort({ isDefault: -1, updatedAt: -1 });
  res.json(addresses);
};

export const createAddress = async (req, res) => {
  const payload = { ...req.body, buyerId: req.user.id };
  if (payload.isDefault) await Address.updateMany({ buyerId: req.user.id }, { isDefault: false });
  const address = await Address.create(payload);
  res.status(201).json(address);
};

export const updateAddress = async (req, res) => {
  const { id } = req.params;
  const payload = { ...req.body };
  if (payload.isDefault) await Address.updateMany({ buyerId: req.user.id }, { isDefault: false });
  const address = await Address.findOneAndUpdate({ _id: id, buyerId: req.user.id }, payload, { new: true });
  res.json(address);
};

export const deleteAddress = async (req, res) => {
  const { id } = req.params;
  await Address.deleteOne({ _id: id, buyerId: req.user.id });
  res.json({ success: true });
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ buyerId: req.user.id }).populate("items.productId");
  res.json(cart || { buyerId: req.user.id, items: [] });
};

export const addToCart = async (req, res) => {
  const { productId, quantity = 1, replaceQuantity = false } = req.body;
  const product = await Product.findById(productId);
  if (!product || !product.isAvailable) return res.status(404).json({ message: "Product not available" });
  const normalizedQuantity = Number(quantity) || 0;
  if (normalizedQuantity <= 0) {
    await Cart.findOneAndUpdate({ buyerId: req.user.id }, { $pull: { items: { productId } } }, { new: true, upsert: true });
    const updatedCart = await Cart.findOne({ buyerId: req.user.id }).populate("items.productId");
    return res.json(updatedCart || { buyerId: req.user.id, items: [] });
  }

  const existingCart = await Cart.findOne({ buyerId: req.user.id }).lean();
  const existingItem = existingCart?.items?.find((item) => item.productId?.toString() === productId);
  const targetQuantity = replaceQuantity
    ? normalizedQuantity
    : (existingItem?.quantity || 0) + normalizedQuantity;

  if (targetQuantity > product.stockQuantity) return res.status(400).json({ message: "Requested quantity exceeds stock" });
  const price = product.discountPrice || product.price;
  const cart = await Cart.findOneAndUpdate(
    { buyerId: req.user.id, "items.productId": productId },
    { $set: { "items.$.quantity": targetQuantity, "items.$.price": price } },
    { new: true }
  );
  if (cart) return res.json(cart);
  const newCart = await Cart.findOneAndUpdate(
    { buyerId: req.user.id },
    { $push: { items: { productId, quantity: targetQuantity, price } } },
    { upsert: true, new: true }
  );
  res.status(201).json(newCart);
};

export const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate({ buyerId: req.user.id }, { items: [] }, { upsert: true });
  res.json({ success: true });
};

export const checkout = async (req, res) => {
  const cart = await Cart.findOne({ buyerId: req.user.id }).populate("items.productId");
  if (!cart || cart.items.length === 0) return res.status(400).json({ message: "Cart empty" });

  const { addressId, paymentMethod = "COD" } = req.body;
  const defaultAddress = await Address.findOne({ buyerId: req.user.id, isDefault: true });
  const explicitAddress = addressId ? await Address.findOne({ _id: addressId, buyerId: req.user.id }) : null;
  const address = explicitAddress || defaultAddress || await Address.findOne({ buyerId: req.user.id });
  if (!address) return res.status(400).json({ message: "Add an address first" });

  const sellerId = cart.items[0]?.productId?.sellerId;
  const hasMultipleSellers = cart.items.some((item) => item.productId.sellerId.toString() !== sellerId.toString());
  if (hasMultipleSellers) return res.status(400).json({ message: "Checkout currently supports one seller per order" });

  const items = cart.items.map((i) => ({
    productId: i.productId._id,
    name: i.productId.name,
    quantity: i.quantity,
    price: i.price,
    image: i.productId.images?.[0]
  }));
  const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = subTotal + DELIVERY_CHARGE;
  const buyer = await User.findById(req.user.id).select("name email phone");
  const primaryItem = items[0] || {};
  const addressText = formatAddress(address);

  for (const item of cart.items) {
    if (item.quantity > item.productId.stockQuantity) {
      return res.status(400).json({ message: `${item.productId.name} is out of stock for requested quantity` });
    }
    const newQty = Math.max(0, item.productId.stockQuantity - item.quantity);
    await Product.findByIdAndUpdate(item.productId._id, {
      $set: { stockQuantity: newQty, isAvailable: newQty > 0 }
    });
  }

  const order = await Order.create({
    buyerId: req.user.id,
    sellerId,
    items,
    productId: primaryItem.productId,
    productName: primaryItem.name,
    productImage: primaryItem.image,
    quantity: totalQuantity,
    productPrice: primaryItem.price || 0,
    subTotal,
    deliveryCharge: DELIVERY_CHARGE,
    deliveryAddress: {
      label: address.label,
      fullName: buyer?.name || "",
      phone: buyer?.phone || "",
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    },
    customerName: buyer?.name || "Customer",
    address: addressText,
    phone: buyer?.phone || "",
    totalAmount,
    paymentMethod,
    paymentStatus: paymentMethod === "COD" ? "pending" : "success",
    statusHistory: [{ status: "placed" }]
  });

  await Payment.create({ orderId: order._id, buyerId: req.user.id, amount: totalAmount, method: paymentMethod, status: paymentMethod === "COD" ? "pending" : "success" });
  await Cart.findOneAndUpdate({ buyerId: req.user.id }, { items: [] });

  await Notification.create({ userId: req.user.id, message: `Order ${order._id} placed`, type: "order" });
  await sendEmail({ to: buyer?.email, subject: "Order placed", html: `<p>Your order ${order._id} has been placed.</p>` });
  
  // Do not notify the seller until the admin approves the order.
  // The admin approval workflow will notify the seller when the order is ready for acceptance.


  res.status(201).json(toOrderSummary(order.toObject()));
};

export const listOrders = async (req, res) => {
  const orders = await Order.find({ buyerId: req.user.id })
    .populate("sellerId", "name shopName phone")
    .populate("deliveryPartnerId", "name phone email")
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders.map((order) => toOrderSummary(order)));
};

export const orderDetail = async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, buyerId: req.user.id })
    .populate("sellerId", "name shopName phone")
    .populate("deliveryPartnerId", "name phone email")
    .lean();
  if (!order) return res.status(404).json({ message: "Order not found" });
  res.json(toOrderSummary(order));
};

export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user.id).populate({
    path: "wishlist",
    strictPopulate: false
  });
  res.json(user?.wishlist || []);
};

export const addWishlist = async (req, res) => {
  const { productId } = req.body;
  await User.findByIdAndUpdate(req.user.id, { $addToSet: { wishlist: productId } });
  res.status(201).json({ success: true });
};

export const removeWishlist = async (req, res) => {
  const { productId } = req.body;
  await User.findByIdAndUpdate(req.user.id, { $pull: { wishlist: productId } });
  res.json({ success: true });
};

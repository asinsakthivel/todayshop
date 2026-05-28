import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";

const mapItems = async (items = []) => {
  const ids = items.map((i) => i.product);
  const products = await Product.find({ _id: { $in: ids } });
  return items.map((i) => {
    const prod = products.find((p) => p._id.toString() === i.product);
    return { product: i.product, qty: i.qty || 1, price: prod?.price ?? i.price ?? 0, seller: prod?.seller };
  });
};

export const placeOrder = async (req, res) => {
  const { items = [], addressId, addressOverride, paymentId = "demo-payment" } = req.body;
  if (!items.length) return res.status(400).json({ message: "Cart empty" });
  const address = addressOverride
    ? addressOverride
    : addressId
      ? await Address.findOne({ _id: addressId, user: req.user.id })
      : await Address.findOne({ user: req.user.id, isDefault: true });
  if (!address) return res.status(400).json({ message: "No address found" });

  const mapped = await mapItems(items);
  const totalAmount = mapped.reduce((s, i) => s + Number(i.price || 0) * Number(i.qty || 1), 0);
  const seller = mapped[0]?.seller || null;

  const order = await Order.create({
    user: req.user.id,
    seller,
    items: mapped.map(({ product, qty, price }) => ({ product, qty, price })),
    totalAmount,
    paymentId,
    address: {
      fullName: address.fullName,
      phone: address.phone,
      line: address.line,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    }
  });

  res.status(201).json(order);
};

export const orderHistory = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
};

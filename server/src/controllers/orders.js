import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Address from "../models/Address.js";

export const createOrder = async (req, res) => {
  const { items = [], address: addressText = "", addressId = null } = req.body;
  if (!items.length) return res.status(400).json({ message: "Cart empty" });

  const firstProduct = await Product.findById(items[0].product);
  const seller = firstProduct?.seller;

  const address =
    (addressId && await Address.findOne({ _id: addressId, user: req.user.id })) ||
    null;

  const addressSnapshot = address
    ? {
        fullName: address.fullName,
        phone: address.phone,
        line: address.line,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      }
    : { line: addressText };

  const mappedItems = await Promise.all(items.map(async (item) => {
    const prod = await Product.findById(item.product);
    return {
      product: item.product,
      qty: item.qty || 1,
      price: prod?.price ?? item.price ?? 0,
    };
  }));

  const totalAmount = mappedItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.qty || 1), 0);

  const order = await Order.create({
    user: req.user.id,
    seller,
    items: mappedItems,
    totalAmount,
    address: addressSnapshot,
    orderStatus: "placed"
  });
  res.status(201).json(order);
};

export const myOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
  res.json(orders);
};

export const sellerOrders = async (req, res) => {
  const orders = await Order.find({ seller: req.user.id, adminApproved: true }).sort({ createdAt: -1 });
  res.json(orders);
};

export const assignDelivery = async (req, res) => {
  const { deliveryPartner } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id, { deliveryPartner, orderStatus: "shipped" }, { new: true });
  if (!order) return res.status(404).json({ message: "Not found" });
  res.json(order);
};

export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const order = await Order.findOneAndUpdate({ _id: req.params.id, deliveryPartner: req.user.id }, { orderStatus: status }, { new: true });
  if (!order) return res.status(404).json({ message: "Not found" });
  res.json(order);
};

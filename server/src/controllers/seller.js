import cloudinary from "../config/cloudinary.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import Delivery from "../models/Delivery.js";
import { readFile } from "fs/promises";
import { emitOrderUpdate, normalizeOrderStatus } from "../utils/orderLifecycle.js";
import { DELIVERY_CHARGE, formatAddress, toOrderSummary } from "../utils/orderPresentation.js";

const MONTH_LABELS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
const PENDING_ORDER_STATUSES = ["placed", "accepted", "packed", "READY_FOR_PICKUP", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"];

const getSellerRevenueValue = (order = {}) => {
  if (order.subTotal !== undefined && order.subTotal !== null) {
    return Number(order.subTotal || 0);
  }
  return Number(order.totalAmount || 0) - Number(order.deliveryCharge || 0);
};

const isSameDay = (dateValue, compareWith = new Date()) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return (
    date.getFullYear() === compareWith.getFullYear() &&
    date.getMonth() === compareWith.getMonth() &&
    date.getDate() === compareWith.getDate()
  );
};

const buildMonthlySeries = (orders = [], year) => {
  const monthKeys = [
    { month: 9, year: year - 1 },
    { month: 10, year: year - 1 },
    { month: 11, year: year - 1 },
    { month: 0, year },
    { month: 1, year },
    { month: 2, year },
    { month: 3, year }
  ];

  return monthKeys.map(({ month, year: entryYear }) => orders
    .filter((order) => {
      const createdAt = new Date(order.createdAt);
      return createdAt.getMonth() === month && createdAt.getFullYear() === entryYear;
    })
    .reduce((sum, order) => sum + getSellerRevenueValue(order), 0));
};

const buildWeeklySales = (orders = []) => {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() + mondayOffset);

  return labels.map((label, index) => {
    const start = new Date(monday);
    start.setDate(monday.getDate() + index);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const total = orders
      .filter((order) => {
        const createdAt = new Date(order.createdAt);
        return createdAt >= start && createdAt < end;
      })
      .reduce((sum, order) => sum + getSellerRevenueValue(order), 0);

    return { label, total };
  });
};

const getStatusBreakdown = (orders = []) => ({
  delivered: orders.filter((order) => normalizeOrderStatus(order.orderStatus) === "DELIVERED").length,
  inTransit: orders.filter((order) => ["READY_FOR_PICKUP", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(normalizeOrderStatus(order.orderStatus))).length,
  packed: orders.filter((order) => normalizeOrderStatus(order.orderStatus) === "packed").length,
  placed: orders.filter((order) => ["placed", "accepted"].includes(normalizeOrderStatus(order.orderStatus))).length
});

const getStatusMeta = (status) => {
  switch (normalizeOrderStatus(status)) {
    case "accepted":
      return { label: "Accepted", className: "sp-accepted" };
    case "packed":
      return { label: "Packed", className: "sp-packed" };
    case "READY_FOR_PICKUP":
      return { label: "Ready For Pickup", className: "sp-ready" };
    case "PICKUP_ASSIGNED":
      return { label: "Pickup Assigned", className: "sp-ready" };
    case "PICKED_UP":
      return { label: "Picked Up", className: "sp-ready" };
    case "OUT_FOR_DELIVERY":
      return { label: "Out For Delivery", className: "sp-ready" };
    case "DELIVERED":
      return { label: "Delivered", className: "sp-ready" };
    case "cancelled":
      return { label: "Cancelled", className: "sp-cancelled" };
    case "placed":
    default:
      return { label: "Placed", className: "sp-placed" };
  }
};

const uploadImages = async (files = []) => {
  if (!files?.length) return [];

  const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
  if (hasCloudinaryConfig) {
    const uploads = [];
    for (const file of files) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "products" });
      uploads.push(result.secure_url);
    }
    return uploads;
  }

  const uploads = [];
  for (const file of files) {
    const buffer = await readFile(file.path);
    const mimeType = file.mimetype || "image/jpeg";
    uploads.push(`data:${mimeType};base64,${buffer.toString("base64")}`);
  }
  return uploads;
};

export const getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
};

export const updateProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
  if (updated?.shopName) {
    await Product.updateMany({ sellerId: req.user.id }, { shopName: updated.shopName });
  }
  res.json(updated);
};

const parseImageUrls = (value) => {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item);
};

const getSellerPendingCount = async (sellerId) => (
  Order.countDocuments({
    sellerId,
    adminApproved: true,
    orderStatus: { $in: PENDING_ORDER_STATUSES }
  })
);

const queueDeliveryAssignment = async (req, order) => {
  const pickupAddress = "Seller pickup location";
  const dropAddress = formatAddress(order.deliveryAddress);
  let delivery = await Delivery.findOne({ orderId: order._id }).sort({ createdAt: -1 });

  if (!delivery) {
    delivery = await Delivery.create({
      orderId: order._id,
      pickupAddress,
      dropAddress,
      currentStatus: "READY_FOR_PICKUP",
      statusHistory: [{ status: "READY_FOR_PICKUP" }]
    });
  } else {
    delivery.deliveryPartnerId = null;
    delivery.currentStatus = "READY_FOR_PICKUP";
    delivery.pickupAddress = pickupAddress;
    delivery.dropAddress = dropAddress;
    delivery.statusHistory.push({ status: "READY_FOR_PICKUP" });
    await delivery.save();
  }

  const allPartners = await User.find({ role: "deliveryPartner", isVerified: true }).select("_id");
  const partnerIds = allPartners.map((partner) => partner._id);

  await Promise.all(
    partnerIds.map((partnerId) =>
      Notification.create({
        userId: partnerId,
        message: `Order ${order._id} is ready for pickup. Accept the pickup from your dashboard.`,
        type: "delivery"
      })
    )
  );

  // Also emit socket event so delivery dashboards can refresh immediately
  emitOrderUpdate(req, partnerIds, {
    type: "DELIVERY_QUEUE_READY",
    orderId: order._id.toString(),
    status: "READY_FOR_PICKUP",
    audience: "delivery",
    message: "A new order is ready for pickup."
  });

  await Notification.create({
    userId: order.sellerId,
    message: partnerIds.length
      ? `Order ${order._id} is now visible in the delivery dashboard.`
      : `Order ${order._id} is ready for pickup. No verified delivery partners are available yet.`,
    type: "delivery"
  });

  return delivery;
};

const ALLOWED_CATEGORIES = [
  "Produce",
  "Dairy",
  "Meat/Seafood",
  "Bakery",
  "Frozen",
  "Pantry/Dry Goods",
  "Beverages",
  "Household Essentials",
];

const normalizeCategory = (value = "") => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const isValidCategory = (value) => ALLOWED_CATEGORIES.map(normalizeCategory).includes(normalizeCategory(value));

const normalizeStoredCategory = (value = "") => {
  const normalized = normalizeCategory(value);
  const original = ALLOWED_CATEGORIES.find((c) => normalizeCategory(c) === normalized);
  return original || value;
};


export const createProduct = async (req, res) => {
  try {
    const seller = await User.findById(req.user.id).select("name shopName");
    const { name, description, price, costPrice, discountPrice, category, stockQuantity, imageUrls } = req.body;

    if (!isValidCategory(category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    const uploads = await uploadImages(req.files);
    const urls = parseImageUrls(imageUrls);
    const normalizedStock = Number(stockQuantity || 0);
    const product = await Product.create({
      sellerId: req.user.id,
      shopName: seller?.shopName || seller?.name,
      name,
      description,
      price: Number(price),
      costPrice: costPrice ? Number(costPrice) : undefined,
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      category: normalizeStoredCategory(category),
      stockQuantity: normalizedStock,
      isAvailable: normalizedStock > 0,
      approvalStatus: "pending",
      approvalNote: "",
      reviewedAt: null,
      reviewedBy: null,
      images: [...urls, ...uploads].slice(0, 8)
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create product" });
  }
};

export const listProducts = async (req, res) => {
  const products = await Product.find({ sellerId: req.user.id });
  res.json(products);
};

export const getProduct = async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, sellerId: req.user.id });
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json(product);
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await User.findById(req.user.id).select("name shopName");

    const payload = { ...req.body };

    if (payload.category !== undefined && !isValidCategory(payload.category)) {
      return res.status(400).json({ message: "Invalid category" });
    }

    if (payload.category !== undefined) {
      payload.category = normalizeStoredCategory(payload.category);
    }


    if (payload.price !== undefined) payload.price = Number(payload.price);
    if (payload.costPrice !== undefined && payload.costPrice !== "") payload.costPrice = Number(payload.costPrice);
    if (payload.costPrice === "") payload.costPrice = undefined;
    if (payload.discountPrice !== undefined && payload.discountPrice !== "") payload.discountPrice = Number(payload.discountPrice);
    if (payload.discountPrice === "") payload.discountPrice = undefined;
    if (payload.stockQuantity !== undefined) {
      payload.stockQuantity = Number(payload.stockQuantity);
      payload.isAvailable = payload.stockQuantity > 0;
    }
    payload.approvalStatus = "pending";
    payload.approvalNote = "";
    payload.reviewedAt = null;
    payload.reviewedBy = null;
    payload.shopName = seller?.shopName || seller?.name;
    const urls = parseImageUrls(payload.imageUrls);
    if (req.files?.length || urls.length) {
      const uploads = await uploadImages(req.files);
      payload.images = [...urls, ...uploads].slice(0, 8);
    }
    const product = await Product.findOneAndUpdate({ _id: id, sellerId: req.user.id }, payload, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update product" });
  }
};

export const deleteProduct = async (req, res) => {
  await Product.deleteOne({ _id: req.params.id, sellerId: req.user.id });
  res.json({ success: true });
};

export const sellerOrders = async (req, res) => {
  const limit = Number(req.query.limit || 0);
  const query = Order.find({ sellerId: req.user.id, adminApproved: true })
    .populate("buyerId", "name phone")
    .populate("deliveryPartnerId", "name phone email")
    .sort({ createdAt: -1 });
  if (limit > 0) query.limit(limit);
  const orders = await query.lean();
  res.json(orders.map((order) => toOrderSummary(order)));
};

export const createOrder = async (req, res) => {
  try {
    const { address = {}, items = [], orderStatus = "placed" } = req.body;
    if (!items.length) return res.status(400).json({ message: "Add at least one item" });

    const mappedItems = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      image: item.image || ""
    }));

    const subTotal = mappedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalAmount = subTotal + DELIVERY_CHARGE;
    const totalQuantity = mappedItems.reduce((sum, item) => sum + item.quantity, 0);
    const primaryItem = mappedItems[0] || {};
    const order = await Order.create({
      buyerId: req.user.id,
      sellerId: req.user.id,
      items: mappedItems,
      productId: primaryItem.productId,
      productName: primaryItem.name,
      productImage: primaryItem.image,
      quantity: totalQuantity,
      productPrice: primaryItem.price || 0,
      subTotal,
      deliveryCharge: DELIVERY_CHARGE,
      deliveryAddress: {
        label: address.label,
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state,
        pincode: address.pincode
      },
      customerName: address.fullName || "Walk-in Customer",
      address: formatAddress(address),
      phone: address.phone || "",
      totalAmount,
      paymentMethod: "COD",
      paymentStatus: "pending",
      orderStatus,
      statusHistory: [{ status: orderStatus }]
    });
    res.status(201).json(toOrderSummary(order.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create order" });
  }
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const nextStatus = normalizeOrderStatus(req.body.status);
  const transitions = {
    placed: ["accepted", "cancelled"],
    accepted: ["packed", "cancelled"],
    packed: ["READY_FOR_PICKUP", "cancelled"],
    READY_FOR_PICKUP: ["PICKUP_ASSIGNED"],
    PICKUP_ASSIGNED: ["PICKED_UP"],
    PICKED_UP: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    DELIVERED: [],
    cancelled: []
  };
  const order = await Order.findOne({ _id: id, sellerId: req.user.id });
  if (!order) return res.status(404).json({ message: "Order not found" });
  const currentStatus = normalizeOrderStatus(order.orderStatus);
  if (!transitions[currentStatus]?.includes(nextStatus)) {
    return res.status(400).json({ message: `Cannot move order from ${currentStatus} to ${nextStatus}` });
  }

  order.orderStatus = nextStatus;
  order.statusHistory.push({ status: nextStatus });
  if (nextStatus === "DELIVERED") {
    order.deliveredAt = new Date();
    order.paymentStatus = "completed";
  }

  if (nextStatus === "READY_FOR_PICKUP") {
    await queueDeliveryAssignment(req, order);
  }

  await order.save();
  await Notification.create({ userId: order.buyerId, message: `Order ${order._id} updated to ${nextStatus}`, type: "order" });
  const pendingOrders = await getSellerPendingCount(order.sellerId);
  emitOrderUpdate(req, [order.buyerId, order.deliveryPartnerId, order.sellerId], {
    type: "ORDER_STATUS_UPDATED",
    orderId: order._id.toString(),
    status: nextStatus,
    pendingOrders
  });
  res.json(toOrderSummary(order.toObject()));
};

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { address = {}, items = [] } = req.body;
    const order = await Order.findOne({ _id: id, sellerId: req.user.id });
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (!items.length) return res.status(400).json({ message: "Add at least one item" });
    order.items = items.map((item) => ({
      productId: item.productId,
      name: item.name,
      quantity: Number(item.quantity || 1),
      price: Number(item.price || 0),
      image: item.image || ""
    }));
    order.deliveryAddress = {
      label: address.label,
      fullName: address.fullName || order.customerName,
      phone: address.phone || order.phone,
      street: address.street,
      city: address.city,
      state: address.state,
      pincode: address.pincode
    };
    const primaryItem = order.items[0] || {};
    order.productId = primaryItem.productId;
    order.productName = primaryItem.name;
    order.productImage = primaryItem.image;
    order.quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    order.productPrice = primaryItem.price || 0;
    order.subTotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    order.deliveryCharge = Number(order.deliveryCharge ?? DELIVERY_CHARGE);
    order.totalAmount = order.subTotal + order.deliveryCharge;
    order.customerName = address.fullName || order.customerName;
    order.phone = address.phone || order.phone;
    order.address = formatAddress(order.deliveryAddress);
    await order.save();
    res.json(toOrderSummary(order.toObject()));
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update order" });
  }
};

export const deleteOrder = async (req, res) => {
  await Order.deleteOne({ _id: req.params.id, sellerId: req.user.id });
  res.json({ success: true });
};

export const analytics = async (req, res) => {
  const seller = await User.findById(req.user.id).select("name shopName");
  const allOrders = await Order.find({ sellerId: req.user.id, adminApproved: true })
    .populate("buyerId", "name phone")
    .populate("deliveryPartnerId", "name phone")
    .sort({ createdAt: -1 })
    .lean();
  const liveOrders = allOrders.filter((order) => order.orderStatus !== "cancelled");
  const deliveredOrders = liveOrders.filter((order) => normalizeOrderStatus(order.orderStatus) === "DELIVERED");
  const revenue = deliveredOrders.reduce((sum, order) => sum + getSellerRevenueValue(order), 0);
  const topProducts = await Product.find({ sellerId: req.user.id }).sort({ reviewCount: -1, createdAt: -1 }).limit(5);
  const products = await Product.find({ sellerId: req.user.id }).sort({ createdAt: -1 });
  const notifications = await Notification.find({ userId: req.user.id }).sort({ isRead: 1, createdAt: -1 }).limit(8).lean();

  const statusCounts = liveOrders.reduce((acc, order) => {
    acc[order.orderStatus] = (acc[order.orderStatus] || 0) + 1;
    return acc;
  }, {});
  const currentYear = new Date().getFullYear();
  const monthlyRevenueCurrent = buildMonthlySeries(liveOrders, currentYear);
  const monthlyRevenuePrevious = buildMonthlySeries(liveOrders, currentYear - 1);
  const weeklySales = buildWeeklySales(liveOrders);
  const pendingOrders = allOrders.filter((order) => PENDING_ORDER_STATUSES.includes(normalizeOrderStatus(order.orderStatus))).length;
  const completedOrders = deliveredOrders.length;
  const activeProducts = products.filter((product) => product.isAvailable).length;
  const lowStockProducts = products.filter((product) => product.stockQuantity > 0 && product.stockQuantity <= 10).length;
  const lastThirtyDays = liveOrders.filter((order) => new Date(order.createdAt) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const previousThirtyDays = liveOrders.filter((order) => {
    const createdAt = new Date(order.createdAt);
    const now = Date.now();
    return createdAt >= new Date(now - 60 * 24 * 60 * 60 * 1000) && createdAt < new Date(now - 30 * 24 * 60 * 60 * 1000);
  });
  const lastPeriodRevenue = lastThirtyDays.reduce((sum, order) => sum + getSellerRevenueValue(order), 0);
  const previousPeriodRevenue = previousThirtyDays.reduce((sum, order) => sum + getSellerRevenueValue(order), 0);
  const revenueChange = previousPeriodRevenue ? ((lastPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 : (lastPeriodRevenue ? 100 : 0);
  const ordersChange = previousThirtyDays.length ? ((lastThirtyDays.length - previousThirtyDays.length) / previousThirtyDays.length) * 100 : (lastThirtyDays.length ? 100 : 0);
  const todaysEarnings = deliveredOrders
    .filter((order) => isSameDay(order.deliveredAt || order.updatedAt))
    .reduce((sum, order) => sum + getSellerRevenueValue(order), 0);

  res.json({
    seller,
    revenue,
    totalRevenue: revenue,
    todayEarnings: todaysEarnings,
    orderCount: allOrders.length,
    totalOrders: allOrders.length,
    activeProducts,
    lowStockProducts,
    pendingOrders,
    completedOrders,
    revenueChange,
    ordersChange,
    topProducts,
    statusCounts,
    statusBreakdown: getStatusBreakdown(allOrders),
    monthlyRevenue: {
      labels: MONTH_LABELS,
      currentYear,
      current: monthlyRevenueCurrent,
      previous: monthlyRevenuePrevious
    },
    weeklySales,
    weeklySalesTotal: weeklySales.reduce((sum, day) => sum + day.total, 0),
    notifications: notifications.map((notification) => ({
      id: notification._id.toString(),
      message: notification.message,
      statusMessage: notification.statusMessage,
      orderId: notification.orderId ? notification.orderId.toString() : null,
      customerName: notification.customerName,
      deliveryLocation: notification.deliveryLocation,
      type: notification.type,
      time: notification.createdAt,
      isRead: notification.isRead
    })),

    unreadNotifications: notifications.filter((notification) => !notification.isRead).length,
    recentOrderHighlights: allOrders.slice(0, 5).map((order) => ({
      id: order._id.toString(),
      totalAmount: order.totalAmount,
      customerName: order.customerName || order.buyerId?.name || "Customer",
      orderStatus: order.orderStatus,
      statusMeta: getStatusMeta(order.orderStatus)
    })),
    recentOrders: allOrders.slice(0, 8).map((order) => toOrderSummary(order))
  });
};

export const earnings = async (req, res) => {
  const deliveredOrders = await Order.find({
    sellerId: req.user.id,
    orderStatus: { $in: ["delivered", "DELIVERED"] }
  }).lean();

  const totalRevenue = deliveredOrders.reduce((sum, order) => sum + getSellerRevenueValue(order), 0);
  const todaysEarnings = deliveredOrders
    .filter((order) => isSameDay(order.deliveredAt || order.updatedAt))
    .reduce((sum, order) => sum + getSellerRevenueValue(order), 0);

  res.json({
    totalOrders: deliveredOrders.length,
    completedOrders: deliveredOrders.length,
    totalRevenue,
    todaysEarnings
  });
};

const runStatusAction = async (req, res, status) => {
  req.body = { ...req.body, status };
  return updateOrderStatus(req, res);
};

export const acceptOrder = async (req, res) => runStatusAction(req, res, "accepted");
export const packOrder = async (req, res) => runStatusAction(req, res, "packed");
export const assignOrderToDelivery = async (req, res) => runStatusAction(req, res, "READY_FOR_PICKUP");

export const reviews = async (req, res) => {
  const products = await Product.find({ sellerId: req.user.id }).select("name reviews");
  const flattened = products.flatMap((p) => p.reviews.map((r) => ({ product: p.name, rating: r.rating, comment: r.comment })));
  res.json(flattened);
};

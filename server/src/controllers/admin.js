import DeliveryApplication from "../models/DeliveryApplication.js";
import DeliveryPartner from "../models/DeliveryPartner.js";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";

const normalizeApprovalStatus = (value, fallback = "pending") => {
  if (value === "approved" || value === "rejected" || value === "pending") return value;
  return fallback;
};

export const getAdminOverview = async (_req, res) => {
  const [buyers, sellers, deliveryPartners, admins, products, deliveryApps, pendingOrders, completedOrders] = await Promise.all([
    User.find({ role: "buyer" }).sort({ createdAt: -1 }).lean(),
    Seller.find().sort({ createdAt: -1 }).lean(),
    DeliveryPartner.find().sort({ createdAt: -1 }).lean(),
    User.find({ role: "admin" }).sort({ createdAt: -1 }).lean(),
    Product.find().populate("sellerId", "name shopName email approvalStatus").sort({ createdAt: -1 }).lean(),
    DeliveryApplication.find().populate("applicant", "name email phone approvalStatus isVerified").sort({ createdAt: -1 }).lean(),
    Order.find({ adminApproved: false, orderStatus: { $ne: "cancelled" } }).lean(),
    Order.countDocuments({ adminApproved: true, orderStatus: { $in: ["delivered", "DELIVERED"] } })
  ]);

  const normalizedSellers = sellers.map((seller) => ({
    ...seller,
    approvalStatus: normalizeApprovalStatus(seller.approvalStatus, seller.isVerified ? "approved" : "pending")
  }));
  const normalizedProducts = products.map((product) => ({
    ...product,
    approvalStatus: normalizeApprovalStatus(product.approvalStatus)
  }));
  const normalizedDeliveryApps = deliveryApps.map((app) => ({
    ...app,
    status: normalizeApprovalStatus(app.status)
  }));

  res.json({
    buyers,
    sellers: normalizedSellers,
    deliveryPartners,
    admins,
    products: normalizedProducts,
    deliveryApplications: normalizedDeliveryApps,
    counts: {
      totalUsers: buyers.length + normalizedSellers.length + deliveryPartners.length + admins.length,
      buyerCount: buyers.length,
      sellerCount: normalizedSellers.length,
      deliveryPartnerCount: deliveryPartners.length,
      adminCount: admins.length,
      sellerPending: normalizedSellers.filter((seller) => seller.approvalStatus === "pending").length,
      productPending: normalizedProducts.filter((product) => product.approvalStatus === "pending").length,
      deliveryPending: normalizedDeliveryApps.filter((app) => app.status === "pending").length,
      ordersPendingApproval: pendingOrders.length,
      ordersCompleted: completedOrders
    }
  });
};

export const listSellerRegistrations = async (_req, res) => {
  const sellers = await Seller.find().sort({ createdAt: -1 }).lean();
  res.json(
    sellers.map((seller) => ({
      ...seller,
      approvalStatus: normalizeApprovalStatus(seller.approvalStatus, seller.isVerified ? "approved" : "pending")
    }))
  );
};

const emitUserUpdate = (req, userId, payload = {}) => {
  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  if (!io || !userSockets) return;
  const socketId = userSockets.get(String(userId));
  if (socketId) {
    io.to(socketId).emit("userUpdate", payload);
  }
};

export const decideSellerRegistration = async (req, res) => {
  const { status, note = "" } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const seller = await User.findOneAndUpdate(
    { _id: req.params.id, role: "seller" },
    {
      approvalStatus: status,
      approvalNote: String(note || "").trim(),
      reviewedAt: new Date(),
      reviewedBy: req.user.id,
      isVerified: status === "approved"
    },
    { new: true }
  );

  if (!seller) return res.status(404).json({ message: "Seller not found" });

  emitUserUpdate(req, seller._id, {
    type: "SELLER_APPROVAL",
    approvalStatus: seller.approvalStatus,
    approvalNote: seller.approvalNote || "",
    reviewedBy: req.user.id
  });

  if (status === "rejected") {
    await Product.updateMany(
      { sellerId: seller._id, approvalStatus: { $ne: "rejected" } },
      {
        approvalStatus: "rejected",
        approvalNote: seller.approvalNote || "Seller registration was rejected by admin.",
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      }
    );
  }

  res.json(seller);
};

export const listProductsForReview = async (_req, res) => {
  const products = await Product.find()
    .populate("sellerId", "name shopName email approvalStatus")
    .sort({ createdAt: -1 })
    .lean();
  res.json(products.map((product) => ({
    ...product,
    approvalStatus: normalizeApprovalStatus(product.approvalStatus)
  })));
};

export const decideProductApproval = async (req, res) => {
  const { status, note = "" } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      approvalStatus: status,
      approvalNote: String(note || "").trim(),
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    },
    { new: true }
  ).populate("sellerId", "name shopName email approvalStatus");

  if (!product) return res.status(404).json({ message: "Product not found" });

  res.json(product);
};

export const deleteProductForReview = async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: "Product not found" });
  res.json({ success: true });
};

export const listDeliveryApps = async (_req, res) => {
  const apps = await DeliveryApplication.find()
    .populate("applicant", "name email phone approvalStatus isVerified")
    .sort({ createdAt: -1 });
  res.json(apps);
};

export const decideDeliveryApp = async (req, res) => {
  const { status, note = "" } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const app = await DeliveryApplication.findByIdAndUpdate(
    req.params.id,
    {
      status,
      reviewNote: String(note || "").trim(),
      reviewedAt: new Date(),
      reviewedBy: req.user.id
    },
    { new: true }
  );
  if (!app) return res.status(404).json({ message: "Not found" });

  await User.findByIdAndUpdate(app.applicant, {
    isVerified: status === "approved",
    approvalStatus: status,
    approvalNote: String(note || "").trim(),
    reviewedAt: new Date(),
    reviewedBy: req.user.id,
    currentStatus: status === "approved" ? "available" : "pending"
  });

  res.json(app);
};

export const deleteDeliveryApp = async (req, res) => {
  const app = await DeliveryApplication.findByIdAndDelete(req.params.id);
  if (!app) return res.status(404).json({ message: "Application not found" });

  await User.findByIdAndUpdate(app.applicant, {
    isVerified: false,
    approvalStatus: "pending",
    approvalNote: "",
    reviewedAt: null,
    reviewedBy: null
  });

  res.json({ success: true });
};

export const deleteUserAccount = async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.status(400).json({ message: "You cannot delete your own admin account" });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role === "admin") {
    return res.status(400).json({ message: "Admin accounts cannot be deleted from this dashboard" });
  }

  if (user.role === "seller") {
    await Product.deleteMany({ sellerId: user._id });
  }

  if (user.role === "deliveryPartner") {
    await DeliveryApplication.deleteMany({ applicant: user._id });
  }

  await User.findByIdAndDelete(user._id);

  res.json({ success: true });
};

export const listPendingOrders = async (_req, res) => {
  const orders = await Order.find({ adminApproved: false, orderStatus: { $ne: "cancelled" } })
    .populate("buyerId", "name email phone")
    .populate("sellerId", "name shopName email")
    .sort({ createdAt: -1 })
    .lean();
  res.json(orders);
};

export const approveOrder = async (req, res) => {
  const { reason = "" } = req.body;
  
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      adminApproved: true,
      adminApprovedBy: req.user.id,
      adminApprovedAt: new Date()
    },
    { new: true }
  ).populate("buyerId", "name email phone").populate("sellerId", "name shopName email");

  if (!order) return res.status(404).json({ message: "Order not found" });

  // Notify seller after admin approval so seller can accept the order.
  await Notification.create({ userId: order.sellerId, message: `Order ${order._id} is approved by admin and ready for seller acceptance`, type: "order" });
  const socketMap = req.app.get("userSockets");
  const io = req.app.get("io");
  const sellerSocketId = socketMap?.get?.(order.sellerId.toString());
  if (io && sellerSocketId) {
    const pendingOrders = await Order.countDocuments({ sellerId: order.sellerId, adminApproved: true, orderStatus: { $in: ["placed", "accepted", "packed", "READY_FOR_PICKUP", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] } });
    io.to(sellerSocketId).emit("orderUpdate", {
      type: "NEW_ORDER_RECEIVED",
      orderId: order._id.toString(),
      status: order.orderStatus,
      audience: "seller",
      message: "Order approved by admin and now available for acceptance.",
      pendingOrders,
      order: order.toObject()
    });
  }

  res.json(order);
};

export const rejectOrder = async (req, res) => {
  const { reason = "" } = req.body;
  
  if (!reason) {
    return res.status(400).json({ message: "Rejection reason is required" });
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      adminApproved: false,
      orderStatus: "cancelled",
      adminRejectReason: reason,
      adminApprovedBy: req.user.id,
      adminApprovedAt: new Date()
    },
    { new: true }
  ).populate("buyerId", "name email phone").populate("sellerId", "name shopName email");

  if (!order) return res.status(404).json({ message: "Order not found" });

  res.json(order);
};

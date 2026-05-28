import Delivery from "../models/Delivery.js";
import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Payment from "../models/Payment.js";
import DeliveryApplication from "../models/DeliveryApplication.js";
import DeliveryReview from "../models/DeliveryReview.js";
import { emitOrderUpdate, normalizeOrderStatus } from "../utils/orderLifecycle.js";
import { DELIVERY_CHARGE, formatAddress, toOrderSummary } from "../utils/orderPresentation.js";

const READY_FOR_PICKUP_STATUSES = ["READY_FOR_PICKUP", "readyForPickup", "assigned"];
const ACTIVE_DELIVERY_STATUSES = [...READY_FOR_PICKUP_STATUSES, "PICKUP_ASSIGNED", "pickupAssigned", "PICKED_UP", "pickedUp", "OUT_FOR_DELIVERY", "outForDelivery", "DELIVERED", "delivered"];
const isSameDay = (dateValue, compareWith = new Date()) => {
  if (!dateValue) return false;
  const date = new Date(dateValue);
  return (
    date.getFullYear() === compareWith.getFullYear() &&
    date.getMonth() === compareWith.getMonth() &&
    date.getDate() === compareWith.getDate()
  );
};

const taskPopulate = {
  path: "orderId",
  populate: [
    { path: "sellerId", select: "name shopName phone" },
    { path: "buyerId", select: "name phone email" },
    { path: "deliveryPartnerId", select: "name phone email" }
  ]
};

const syncMissingTasksForPartner = async (partnerId) => {
  const assignedOrders = await Order.find({ deliveryPartnerId: partnerId }).lean();
  for (const order of assignedOrders) {
    const normalizedStatus = normalizeOrderStatus(order.orderStatus);
    const actionable = ["READY_FOR_PICKUP", "PICKUP_ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"].includes(normalizedStatus);
    if (!actionable) continue;

    const existingTask = await Delivery.findOne({ orderId: order._id, deliveryPartnerId: partnerId });
    if (existingTask) continue;

    const dropAddress = [
      order.deliveryAddress?.street,
      order.deliveryAddress?.city,
      order.deliveryAddress?.state,
      order.deliveryAddress?.pincode
    ].filter(Boolean).join(", ");

    await Delivery.create({
      orderId: order._id,
      deliveryPartnerId: partnerId,
      pickupAddress: "Seller pickup location",
      dropAddress,
      currentStatus: normalizedStatus,
      statusHistory: [{ status: normalizedStatus }]
    });
  }
};

const syncOpenPickupTasks = async () => {
  const readyOrders = await Order.find({ orderStatus: { $in: READY_FOR_PICKUP_STATUSES } }).lean();

  for (const order of readyOrders) {
    const normalizedStatus = normalizeOrderStatus(order.orderStatus);
    const pickupAddress = "Seller pickup location";
    const dropAddress = formatAddress(order.deliveryAddress);
    const existingTask = await Delivery.findOne({ orderId: order._id }).sort({ createdAt: -1 });

    if (!existingTask) {
      await Delivery.create({
        orderId: order._id,
        pickupAddress,
        dropAddress,
        currentStatus: normalizedStatus,
        statusHistory: [{ status: normalizedStatus }]
      });
      continue;
    }

    let shouldSave = false;
    if (normalizeOrderStatus(existingTask.currentStatus) !== normalizedStatus) {
      existingTask.currentStatus = normalizedStatus;
      shouldSave = true;
    }
    if (!existingTask.pickupAddress && pickupAddress) {
      existingTask.pickupAddress = pickupAddress;
      shouldSave = true;
    }
    if (!existingTask.dropAddress && dropAddress) {
      existingTask.dropAddress = dropAddress;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingTask.save();
    }
  }
};

export const getProfile = async (req, res) => {
  await syncMissingTasksForPartner(req.user.id);

  const deliveries = await Delivery.countDocuments({ deliveryPartnerId: req.user.id });
  const user = await User.findById(req.user.id).select("-password");
  const application = await DeliveryApplication.findOne({ applicant: req.user.id }).sort({ updatedAt: -1 });

  // Unread items first, then newest
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ isRead: 1, createdAt: -1 })
    .limit(8)
    .lean();

  res.json({
    ...user.toObject(),
    deliveries,
    application,
    notifications: notifications.map((item) => ({
      id: item._id.toString(),
      message: item.message,
      statusMessage: item.statusMessage,
      orderId: item.orderId ? item.orderId.toString() : null,
      customerName: item.customerName,
      deliveryLocation: item.deliveryLocation,
      type: item.type,
      isRead: item.isRead,
      time: item.createdAt,
      createdAt: item.createdAt
    }))
  });
};


export const updateProfile = async (req, res) => {
  const updated = await User.findByIdAndUpdate(req.user.id, req.body, { new: true }).select("-password");
  res.json(updated);
};

export const getKycApplication = async (req, res) => {
  const application = await DeliveryApplication.findOne({ applicant: req.user.id }).sort({ updatedAt: -1 });
  res.json(application || null);
};

export const submitKycApplication = async (req, res) => {
  const {
    name,
    phone,
    email,
    aadhaarNumber,
    licenseNumber,
    vehicleNumber,
    accountNumber,
    ifsc,
    existingAadhaarUrl,
    existingLicenseUrl,
    existingSelfieUrl
  } = req.body;
  const fileUrl = (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`;
  const aadhaarUrl = req.files?.aadhaarPhoto?.[0] ? fileUrl(req.files.aadhaarPhoto[0]) : existingAadhaarUrl || "";
  const licenseUrl = req.files?.licensePhoto?.[0] ? fileUrl(req.files.licensePhoto[0]) : existingLicenseUrl || "";
  const selfieUrl = req.files?.selfie?.[0] ? fileUrl(req.files.selfie[0]) : existingSelfieUrl || "";

  const application = await DeliveryApplication.findOneAndUpdate(
    { applicant: req.user.id },
    {
      applicant: req.user.id,
      name,
      phone,
      email,
      aadhaarNumber,
      licenseNumber,
      vehicleNumber,
      aadhaarUrl,
      licenseUrl,
      selfieUrl,
      bank: {
        account: accountNumber,
        ifsc
      },
      status: "pending",
      reviewNote: "",
      reviewedAt: null,
      reviewedBy: null
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await User.findByIdAndUpdate(req.user.id, {
    name,
    phone,
    email,
    isVerified: false,
    approvalStatus: "pending",
    approvalNote: ""
  });

  res.status(201).json(application);
};

export const tasks = async (req, res) => {
  await syncMissingTasksForPartner(req.user.id);
  await syncOpenPickupTasks();
  
  // Get tasks specifically assigned to this delivery partner
  const assignedTasks = await Delivery.find({ deliveryPartnerId: req.user.id })
    .sort({ createdAt: -1 })
    .populate(taskPopulate);
  
  // Get all READY_FOR_PICKUP tasks (including those with seller as placeholder deliveryPartnerId)
  const allReadyTasks = await Delivery.find({ currentStatus: { $in: READY_FOR_PICKUP_STATUSES } })
    .sort({ createdAt: -1 })
    .populate(taskPopulate);
  
  // Filter to get unassigned ready tasks (exclude tasks already assigned to this partner)
  const assignedTaskIds = new Set(assignedTasks.map(t => t._id.toString()));
  const unassignedReadyTasks = allReadyTasks.filter(task => !assignedTaskIds.has(task._id.toString()));
  
  // Combine both lists (assigned tasks first, then unassigned ready tasks)
  const tasksList = [...assignedTasks, ...unassignedReadyTasks]
    .filter((task) => ACTIVE_DELIVERY_STATUSES.includes(task.currentStatus))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(tasksList);
};

export const acceptTask = async (req, res) => {
  const delivery = await Delivery.findOne({
    _id: req.params.id,
    $or: [
      { deliveryPartnerId: req.user.id },
      { deliveryPartnerId: null },
      { currentStatus: { $in: READY_FOR_PICKUP_STATUSES } }
    ]
  });
  
  if (!delivery) return res.status(404).json({ message: "Task not found" });
  if (normalizeOrderStatus(delivery.currentStatus) !== "READY_FOR_PICKUP") {
    return res.status(400).json({ message: "Pickup can only be accepted when the order is ready for pickup" });
  }

  // Assign this task to the current delivery partner
  delivery.deliveryPartnerId = req.user.id;
  delivery.currentStatus = "PICKUP_ASSIGNED";
  delivery.statusHistory.push({ status: "PICKUP_ASSIGNED" });
  await delivery.save();
  await User.findByIdAndUpdate(req.user.id, { currentStatus: "busy" });

  const order = await Order.findById(delivery.orderId);
  if (order) {
    order.orderStatus = "PICKUP_ASSIGNED";
    order.deliveryPartnerId = req.user.id;
    order.statusHistory.push({ status: "PICKUP_ASSIGNED" });
    await order.save();
    await Notification.create({
      userId: order.buyerId,
      message: `Pickup accepted for order ${order._id}`,
      statusMessage: `Pickup accepted for Order ${order._id}`,
      orderId: order._id,
      customerName: order.buyerId?.name || order.customerName || "Customer",
      deliveryLocation: order.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
      type: "delivery"
    });

    await Notification.create({
      userId: order.sellerId,
      message: `Delivery partner assigned pickup for order ${order._id}`,
      statusMessage: `Delivery partner assigned pickup for Order ${order._id}`,
      orderId: order._id,
      customerName: order.buyerId?.name || order.customerName || "Customer",
      deliveryLocation: order.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
      type: "delivery"
    });

    emitOrderUpdate(req, [order.buyerId, order.sellerId, req.user.id], {
      type: "DELIVERY_PARTNER_ASSIGNED",
      orderId: order._id.toString(),
      status: "PICKUP_ASSIGNED",
      audience: "delivery"
    });
  }

  await Notification.create({
    userId: req.user.id,
    message: `You accepted pickup for delivery ${delivery._id}`,
    statusMessage: `Pickup accepted for Delivery task ${delivery._id}`,
    orderId: delivery.orderId,
    customerName: order?.buyerId?.name || "Customer",
    deliveryLocation: order?.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
    type: "delivery"
  });


  res.json(delivery);
};

export const rejectTask = async (req, res) => {
  const delivery = await Delivery.findOneAndUpdate(
    { _id: req.params.id, deliveryPartnerId: req.user.id },
    {
      $set: {
        deliveryPartnerId: null,
        currentStatus: "READY_FOR_PICKUP"
      },
      $push: { statusHistory: { status: "READY_FOR_PICKUP" } }
    },
    { new: true }
  );
  if (delivery) {
    await Order.findByIdAndUpdate(delivery.orderId, {
      $unset: { deliveryPartnerId: 1 },
      $set: { orderStatus: "READY_FOR_PICKUP" },
      $push: { statusHistory: { status: "READY_FOR_PICKUP" } }
    });
  }
  await User.findByIdAndUpdate(req.user.id, { currentStatus: "available" });
  res.json(delivery);
};

export const updateStatus = async (req, res) => {
  const nextStatus = normalizeOrderStatus(req.body.status);
  const transitions = {
    PICKUP_ASSIGNED: ["PICKED_UP"],
    PICKED_UP: ["OUT_FOR_DELIVERY"],
    OUT_FOR_DELIVERY: ["DELIVERED"],
    READY_FOR_PICKUP: ["PICKUP_ASSIGNED"],
    assigned: ["PICKUP_ASSIGNED"]
  };
  const delivery = await Delivery.findOne({ _id: req.params.id, deliveryPartnerId: req.user.id });
  if (!delivery) return res.status(404).json({ message: "Task not found" });
  const currentStatus = normalizeOrderStatus(delivery.currentStatus);
  if (!transitions[currentStatus]?.includes(nextStatus)) {
    return res.status(400).json({ message: `Cannot move delivery from ${currentStatus} to ${nextStatus}` });
  }
  delivery.currentStatus = nextStatus;
  delivery.statusHistory.push({ status: nextStatus });
  if (nextStatus === "DELIVERED") {
    delivery.earnings = delivery.earnings || DELIVERY_CHARGE;
  }
  await delivery.save();
  const orderUpdate = {
    orderStatus: nextStatus,
    $push: { statusHistory: { status: nextStatus } }
  };
  if (nextStatus === "DELIVERED") {
    orderUpdate.paymentStatus = "completed";
    orderUpdate.deliveredAt = new Date();
  }
  const order = await Order.findByIdAndUpdate(
    delivery.orderId,
    orderUpdate,
    { new: true }
  );
  const statusHuman = nextStatus === "READY_FOR_PICKUP" ? "Ready for Pickup" : nextStatus;

  await Notification.create({
    userId: order.buyerId,
    message: `Order ${order._id} updated to ${nextStatus}`,
    statusMessage: `Order ${order._id} status changed: ${statusHuman}`,
    orderId: order._id,
    customerName: order.buyerId?.name || "Customer",
    deliveryLocation: order.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
    type: "delivery"
  });

  await Notification.create({
    userId: order.sellerId,
    message: `Delivery progress for order ${order._id}: ${nextStatus}`,
    statusMessage: `Delivery progress for Order ${order._id}: ${statusHuman}`,
    orderId: order._id,
    customerName: order.buyerId?.name || "Customer",
    deliveryLocation: order.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
    type: "delivery"
  });

  if (nextStatus === "DELIVERED") {
    await Payment.findOneAndUpdate({ orderId: delivery.orderId }, { status: "completed" });
    await User.findByIdAndUpdate(req.user.id, { currentStatus: "available" });
  }
  emitOrderUpdate(req, [order?.buyerId, order?.sellerId, req.user.id], {
    type: "DELIVERY_STATUS_UPDATED",
    orderId: delivery.orderId.toString(),
    status: nextStatus,
    deliveryEarnings: nextStatus === "DELIVERED" ? delivery.earnings : undefined,
    order: order ? toOrderSummary(order.toObject ? order.toObject() : order) : undefined
  });
  res.json(delivery);
};

export const earnings = async (req, res) => {
  const deliveries = await Delivery.find({ deliveryPartnerId: req.user.id })
    .populate("orderId")
    .lean();
  const deliveredTasks = deliveries.filter((item) => normalizeOrderStatus(item.currentStatus) === "DELIVERED");
  const total = deliveredTasks.reduce((sum, d) => sum + (d.earnings || 0), 0);
  const deliveredToday = deliveredTasks.filter((item) => isSameDay(item.updatedAt)).length;
  res.json({
    total,
    count: deliveredTasks.length,
    totalDeliveries: deliveries.length,
    deliveredToday,
    totalDeliveryEarnings: total,
    completedDeliveries: deliveredTasks.map((task) => ({
      ...task,
      order: task.orderId ? toOrderSummary(task.orderId) : null
    }))
  });
};

const resolveTaskIdFromOrder = async (orderId) => {
  const delivery = await Delivery.findOne({ orderId }).sort({ createdAt: -1 });
  return delivery?._id?.toString() || null;
};

export const pickupOrder = async (req, res) => {
  const taskId = await resolveTaskIdFromOrder(req.params.id);
  if (!taskId) return res.status(404).json({ message: "Task not found" });
  req.params.id = taskId;
  req.body = { ...req.body, status: "PICKED_UP" };
  return updateStatus(req, res);
};

export const outForDeliveryOrder = async (req, res) => {
  const taskId = await resolveTaskIdFromOrder(req.params.id);
  if (!taskId) return res.status(404).json({ message: "Task not found" });
  req.params.id = taskId;
  req.body = { ...req.body, status: "OUT_FOR_DELIVERY" };
  return updateStatus(req, res);
};

export const deliverOrder = async (req, res) => {
  const taskId = await resolveTaskIdFromOrder(req.params.id);
  if (!taskId) return res.status(404).json({ message: "Task not found" });
  req.params.id = taskId;
  req.body = { ...req.body, status: "DELIVERED" };
  return updateStatus(req, res);
};

export const submitDeliveryReview = async (req, res) => {
  const { deliveryId, orderId, rating, review, deliveryExperience } = req.body;
  
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }
  
  // Check if order exists and is delivered
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  if (normalizeOrderStatus(order.orderStatus) !== "DELIVERED") {
    return res.status(400).json({ message: "Can only review delivered orders" });
  }
  
  // Check if delivery exists
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    return res.status(404).json({ message: "Delivery task not found" });
  }
  
  // Check if review already exists
  const existingReview = await DeliveryReview.findOne({ orderId, buyerId: req.user.id });
  if (existingReview) {
    return res.status(400).json({ message: "You have already reviewed this delivery" });
  }
  
  // Create the review
  const reviewDoc = await DeliveryReview.create({
    deliveryId,
    orderId,
    buyerId: req.user.id,
    deliveryPartnerId: delivery.deliveryPartnerId,
    rating,
    review: review || "",
    deliveryExperience: deliveryExperience || "good"
  });
  
  // Notify the delivery partner about the review
  await Notification.create({
    userId: delivery.deliveryPartnerId,
    message: `You received a ${rating}-star review for order ${orderId}`,
    type: "delivery_review"
  });
  
  // Emit socket event to delivery partner
  emitOrderUpdate(req, [delivery.deliveryPartnerId], {
    orderId: orderId.toString(),
    status: "REVIEWED",
    rating,
    audience: "delivery"
  });
  
  res.status(201).json(reviewDoc);
};

export const getDeliveryReviews = async (req, res) => {
  const { deliveryPartnerId } = req.query;
  
  // If no partner ID specified, use the current user's ID
  const targetPartnerId = deliveryPartnerId || req.user.id;
  
  const reviews = await DeliveryReview.find({ deliveryPartnerId: targetPartnerId })
    .populate("orderId", "_id totalAmount orderStatus")
    .populate("buyerId", "name phone")
    .sort({ createdAt: -1 });
  
  // Calculate average rating
  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;
  
  res.json({
    reviews,
    averageRating,
    totalReviews: reviews.length
  });
};

export const markPaymentReceived = async (req, res) => {
  const { orderId } = req.body;
  
  // Find the order
  const order = await Order.findById(orderId).populate("sellerId buyerId deliveryPartnerId");
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }
  
  // Check if order is delivered
  if (normalizeOrderStatus(order.orderStatus) !== "DELIVERED") {
    return res.status(400).json({ message: "Payment can only be marked as received for delivered orders" });
  }
  
  // Find or create payment record
  let payment = await Payment.findOne({ orderId });
  if (!payment) {
    return res.status(404).json({ message: "Payment record not found" });
  }
  
  // Update payment status
  payment.status = "completed";
  payment.transactionId = payment.transactionId || `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  await payment.save();
  
  // Update order payment status
  order.paymentStatus = "completed";
  await order.save();
  
  // Notify all relevant parties about payment receipt
  const notifications = [
    {
      userId: order.sellerId._id,
      message: `Payment of ₹${order.totalAmount} received for order ${orderId}`,
      type: "payment"
    },
    {
      userId: order.buyerId._id,
      message: `Your payment for order ${orderId} has been successfully processed`,
      type: "payment"
    },
    {
      userId: order.deliveryPartnerId?._id,
      message: `Payment confirmed for order ${orderId}. Delivery completed successfully!`,
      type: "payment"
    }
  ];
  
  for (const notif of notifications) {
    if (notif.userId) {
      await Notification.create(notif);
    }
  }
  
  // Emit socket event to all parties
  const relevantUserIds = [order.sellerId._id, order.buyerId._id];
  if (order.deliveryPartnerId?._id) {
    relevantUserIds.push(order.deliveryPartnerId._id);
  }
  
  emitOrderUpdate(req, relevantUserIds, {
    orderId: orderId.toString(),
    status: "PAYMENT_RECEIVED",
    paymentStatus: "completed",
    audience: "all"
  });
  
  res.json({
    message: "Payment marked as received successfully",
    payment,
    order
  });
};

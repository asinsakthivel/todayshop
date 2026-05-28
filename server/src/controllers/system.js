import Order from "../models/Order.js";
import Notification from "../models/Notification.js";
import { assignDelivery } from "../utils/assignDelivery.js";
import { emitOrderUpdate, normalizeOrderStatus } from "../utils/orderLifecycle.js";

export const assignDeliveryController = async (req, res) => {
  const order = await Order.findById(req.body.orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });
  if (normalizeOrderStatus(order.orderStatus) !== "READY_FOR_PICKUP") {
    return res.status(400).json({ message: "Delivery can only be assigned when order is ready for pickup" });
  }
  if (order.deliveryPartnerId) {
    return res.status(400).json({ message: "Delivery partner already assigned" });
  }
  const result = await assignDelivery({ order, pickupAddress: req.body.pickupAddress, dropAddress: req.body.dropAddress });
  if (!result) return res.status(400).json({ message: "No partner available" });
  order.deliveryPartnerId = result.partnerId;
  await order.save();
  await Notification.create({
    userId: result.partnerId,
    message: `New delivery assigned for order ${order._id}`,
    statusMessage: `New delivery task assigned for Order ${order._id}`,
    orderId: order._id,
    customerName: order.buyerId?.name || "Customer",
    deliveryLocation: order.deliveryAddress ? `${order.deliveryAddress?.street || ""}, ${order.deliveryAddress?.city || ""}`.trim().replace(/^,\s*/, "") : "Delivery location",
    type: "delivery"
  });

  emitOrderUpdate(req, [result.partnerId], {
    orderId: order._id.toString(),
    status: "READY_FOR_PICKUP",
    audience: "delivery"
  });
  res.json({ success: true, deliveryId: result.deliveryId });
};


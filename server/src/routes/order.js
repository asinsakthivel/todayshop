import express from "express";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import { verifyToken } from "../middleware/auth.js";
import { toOrderSummary } from "../utils/orderPresentation.js";

const router = express.Router();

router.get("/:id", verifyToken, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("buyerId", "name phone email")
    .populate("sellerId", "name shopName phone email")
    .populate("deliveryPartnerId", "name phone email");
  if (!order) return res.status(404).json({ message: "Not found" });
  const canAccess = [
    order.buyerId?._id?.toString() || order.buyerId?.toString(),
    order.sellerId?._id?.toString() || order.sellerId?.toString(),
    order.deliveryPartnerId?._id?.toString() || order.deliveryPartnerId?.toString()
  ].includes(req.user.id);
  if (!canAccess) {
    return res.status(403).json({ message: "Forbidden" });
  }
  const delivery = await Delivery.findOne({ orderId: order._id }).sort({ createdAt: -1 });
  res.json({ ...toOrderSummary(order.toObject()), delivery });
});

export default router;

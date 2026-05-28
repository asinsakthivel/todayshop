import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { createOrder, myOrders, sellerOrders, assignDelivery, updateStatus } from "../controllers/orders.js";

const router = Router();
router.post("/", auth, requireRole("user"), createOrder);
router.get("/my", auth, requireRole("user"), myOrders);
router.get("/seller", auth, requireRole("seller"), sellerOrders);
router.patch("/:id/assign", auth, requireRole("admin"), assignDelivery);
router.patch("/:id/status", auth, requireRole("delivery"), updateStatus);

export default router;

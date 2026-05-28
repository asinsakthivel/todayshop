import express from "express";
import multer from "multer";
import {
  getProfile, updateProfile, createProduct, listProducts, getProduct, updateProduct, deleteProduct,
  sellerOrders, createOrder, updateOrder, updateOrderStatus, deleteOrder, analytics, reviews,
  earnings, acceptOrder, packOrder, assignOrderToDelivery
} from "../controllers/seller.js";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();
const guard = [verifyToken, requireRole(["seller"])];

router.get("/profile", ...guard, getProfile);
router.put("/profile", ...guard, updateProfile);
router.post("/products", ...guard, upload.array("images", 8), createProduct);
router.get("/products", ...guard, listProducts);
router.get("/products/:id", ...guard, getProduct);
router.put("/products/:id", ...guard, upload.array("images", 8), updateProduct);
router.delete("/products/:id", ...guard, deleteProduct);
router.get("/orders", ...guard, sellerOrders);
router.post("/orders", ...guard, createOrder);
router.put("/orders/:id", ...guard, updateOrder);
router.put("/orders/:id/status", ...guard, updateOrderStatus);
router.put("/order/:id/accept", ...guard, acceptOrder);
router.put("/order/:id/pack", ...guard, packOrder);
router.put("/order/:id/assign", ...guard, assignOrderToDelivery);
router.delete("/orders/:id", ...guard, deleteOrder);
router.get("/analytics", ...guard, analytics);
router.get("/earnings", ...guard, earnings);
router.get("/reviews", ...guard, reviews);

export default router;

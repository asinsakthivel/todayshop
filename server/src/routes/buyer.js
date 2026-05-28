import express from "express";
import {
  getProfile, updateProfile, getAddresses, createAddress, updateAddress, deleteAddress,
  getCart, addToCart, clearCart, checkout, listOrders, orderDetail,
  getWishlist, addWishlist, removeWishlist
} from "../controllers/buyer.js";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();
const guard = [verifyToken, requireRole(["buyer"])] ;

router.get("/profile", ...guard, getProfile);
router.put("/profile", ...guard, updateProfile);
router.get("/addresses", ...guard, getAddresses);
router.post("/addresses", ...guard, createAddress);
router.put("/addresses/:id", ...guard, updateAddress);
router.delete("/addresses/:id", ...guard, deleteAddress);
router.get("/cart", ...guard, getCart);
router.post("/cart", ...guard, addToCart);
router.delete("/cart", ...guard, clearCart);
router.post("/cart/checkout", ...guard, checkout);
router.get("/orders", ...guard, listOrders);
router.get("/orders/:id", ...guard, orderDetail);
router.get("/wishlist", ...guard, getWishlist);
router.post("/wishlist", ...guard, addWishlist);
router.delete("/wishlist", ...guard, removeWishlist);

export default router;

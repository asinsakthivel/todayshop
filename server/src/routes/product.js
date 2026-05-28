import express from "express";
import { listProducts, getProduct, addReview } from "../controllers/product.js";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.get("/", listProducts);
router.get("/:id", getProduct);
router.post("/:id/review", verifyToken, requireRole(["buyer"]), addReview);

export default router;

import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { listProducts, listMyProducts, createProduct, updateProduct, deleteProduct } from "../controllers/products.js";

const router = Router();
router.get("/", listProducts);
router.get("/mine", auth, requireRole("seller"), listMyProducts);
router.post("/", auth, requireRole("seller"), createProduct);
router.patch("/:id", auth, requireRole("seller"), updateProduct);
router.delete("/:id", auth, requireRole("seller"), deleteProduct);

export default router;

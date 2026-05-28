import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getCart, setCart } from "../controllers/cart.js";

const router = Router();
router.get("/", auth, getCart);
router.post("/", auth, setCart);

export default router;

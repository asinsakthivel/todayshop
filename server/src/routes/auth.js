import express from "express";
import { login, me, register } from "../controllers/auth.js";
import { protect as verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", verifyToken, me);

export default router;

import express from "express";
import { checkout } from "../controllers/buyer.js";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();

router.post("/create", verifyToken, requireRole(["buyer"]), checkout);

export default router;

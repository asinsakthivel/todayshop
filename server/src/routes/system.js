import express from "express";
import { assignDeliveryController } from "../controllers/system.js";

const router = express.Router();
router.post("/assign-delivery", assignDeliveryController);

export default router;

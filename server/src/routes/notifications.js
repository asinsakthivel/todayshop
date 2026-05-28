import express from "express";
import { verifyToken } from "../middleware/auth.js";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from "../controllers/notifications.js";

const router = express.Router();

router.get("/", verifyToken, getMyNotifications);

// Single notification
router.put("/:id/read", verifyToken, markNotificationRead);

// Mark all notifications read
router.put("/mark-read", verifyToken, markAllNotificationsRead);

export default router;
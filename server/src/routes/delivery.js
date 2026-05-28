import express from "express";
import multer from "multer";
import {
  getProfile, updateProfile, getKycApplication, submitKycApplication, tasks, acceptTask, rejectTask, updateStatus, earnings,
  submitDeliveryReview, getDeliveryReviews, markPaymentReceived, pickupOrder, outForDeliveryOrder, deliverOrder
} from "../controllers/delivery.js";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const guard = [verifyToken, requireRole(["deliveryPartner"])];

router.get("/profile", ...guard, getProfile);
router.put("/profile", ...guard, updateProfile);
router.get("/application", ...guard, getKycApplication);
router.post(
  "/application",
  ...guard,
  upload.fields([
    { name: "aadhaarPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 },
    { name: "selfie", maxCount: 1 }
  ]),
  submitKycApplication
);
router.get("/tasks", ...guard, tasks);
router.put("/tasks/:id/accept", ...guard, acceptTask);
router.put("/tasks/:id/reject", ...guard, rejectTask);
router.put("/tasks/:id/status", ...guard, updateStatus);
router.put("/order/:id/pickup", ...guard, pickupOrder);
router.put("/order/:id/out-for-delivery", ...guard, outForDeliveryOrder);
router.put("/order/:id/delivered", ...guard, deliverOrder);
router.get("/earnings", ...guard, earnings);

// Delivery review endpoints
router.post("/reviews", ...guard, submitDeliveryReview);
router.get("/reviews", ...guard, getDeliveryReviews);

// Payment notification endpoint
router.post("/payment/confirm", ...guard, markPaymentReceived);

export default router;

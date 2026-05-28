import express from "express";
import {
  createReview,
  getSellerReviews,
  getDeliveryReviews,
  getProductCustomerReviews
} from "../controllers/reviews.js";

import { verifyToken as auth } from "../middleware/auth.js";
import { requireRole as role } from "../middleware/role.js";

const router = express.Router();

router.post(
  "/:orderId",
  auth,
  role(["buyer"]),
  createReview
);

router.get(
  "/seller",
  auth,
  role(["seller"]),
  getSellerReviews
);

router.get(
  "/delivery",
  auth,
  role(["deliveryPartner"]),
  getDeliveryReviews
);

router.get(
  "/product/:productId",
  getProductCustomerReviews
);

export default router;


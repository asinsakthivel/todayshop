import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import {
  getAdminOverview,
  listSellerRegistrations,
  decideSellerRegistration,
  deleteUserAccount,
  listProductsForReview,
  decideProductApproval,
  deleteProductForReview,
  listDeliveryApps,
  decideDeliveryApp,
  deleteDeliveryApp,
  listPendingOrders,
  approveOrder,
  rejectOrder
} from "../controllers/admin.js";

const router = Router();
router.get("/overview", verifyToken, requireRole(["admin"]), getAdminOverview);
router.get("/sellers", verifyToken, requireRole(["admin"]), listSellerRegistrations);
router.patch("/sellers/:id", verifyToken, requireRole(["admin"]), decideSellerRegistration);
router.delete("/users/:id", verifyToken, requireRole(["admin"]), deleteUserAccount);
router.get("/products", verifyToken, requireRole(["admin"]), listProductsForReview);
router.patch("/products/:id", verifyToken, requireRole(["admin"]), decideProductApproval);
router.delete("/products/:id", verifyToken, requireRole(["admin"]), deleteProductForReview);
router.get("/delivery-apps", verifyToken, requireRole(["admin"]), listDeliveryApps);
router.patch("/delivery-apps/:id", verifyToken, requireRole(["admin"]), decideDeliveryApp);
router.delete("/delivery-apps/:id", verifyToken, requireRole(["admin"]), deleteDeliveryApp);
router.get("/orders/pending", verifyToken, requireRole(["admin"]), listPendingOrders);
router.patch("/orders/:id/approve", verifyToken, requireRole(["admin"]), approveOrder);
router.patch("/orders/:id/reject", verifyToken, requireRole(["admin"]), rejectOrder);

export default router;

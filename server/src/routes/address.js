import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { addAddress, getDefaultAddress, updateAddress, deleteAddress, listAddresses } from "../controllers/address.js";

const router = Router();
router.post("/", auth, addAddress);
router.get("/", auth, listAddresses);
router.get("/default", auth, getDefaultAddress);
router.patch("/:id", auth, updateAddress);
router.delete("/:id", auth, deleteAddress);

export default router;

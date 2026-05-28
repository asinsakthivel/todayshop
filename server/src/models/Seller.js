import mongoose from "mongoose";
import { applyRoleScope, buildCommonUserFields } from "./shared/userCommon.js";

const sellerSchema = new mongoose.Schema(
  {
    ...buildCommonUserFields(),
    role: { type: String, enum: ["seller"], default: "seller" },
    shopName: { type: String, required: true, trim: true }
  },
  { timestamps: true }
);

applyRoleScope(sellerSchema, "seller");

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema, "users");

export default Seller;

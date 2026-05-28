import mongoose from "mongoose";
import { applyRoleScope, buildCommonUserFields } from "./shared/userCommon.js";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    ...buildCommonUserFields(),
    role: { type: String, enum: ["deliveryPartner"], default: "deliveryPartner" },
    currentStatus: { type: String, default: "available" }
  },
  { timestamps: true }
);

applyRoleScope(deliveryPartnerSchema, "deliveryPartner");

const DeliveryPartner = mongoose.models.DeliveryPartner || mongoose.model("DeliveryPartner", deliveryPartnerSchema, "users");

export default DeliveryPartner;

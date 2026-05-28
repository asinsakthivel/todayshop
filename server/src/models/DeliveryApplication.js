import mongoose from "mongoose";

const deliveryApplicationSchema = new mongoose.Schema({
  applicant: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  phone: String,
  email: String,
  address: String,
  aadhaarNumber: String,
  licenseNumber: String,
  vehicleNumber: String,
  aadhaarUrl: String,
  licenseUrl: String,
  selfieUrl: String,
  bank: {
    account: String,
    ifsc: String
  },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  reviewNote: { type: String, default: "" },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export default mongoose.model("DeliveryApplication", deliveryApplicationSchema);

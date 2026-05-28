import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  label: { type: String, default: "Home" },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Address", addressSchema);

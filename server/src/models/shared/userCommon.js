import mongoose from "mongoose";

export const USER_ROLE_ENUM = ["buyer", "seller", "deliveryPartner", "admin"];

export const approvalStatusDefault = function approvalStatusDefault() {
  return this.role === "buyer" || this.role === "admin" ? "approved" : "pending";
};

export const buildCommonUserFields = () => ({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  phone: String,
  shopName: String,
  role: {
    type: String,
    enum: USER_ROLE_ENUM,
    default: "buyer"
  },
  isVerified: { type: Boolean, default: false },
  approvalStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: approvalStatusDefault
  },
  approvalNote: { type: String, default: "" },
  reviewedAt: Date,
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  currentStatus: { type: String, default: "available" },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
});

const scopedQueryMethods = [
  "countDocuments",
  "find",
  "findOne",
  "findOneAndDelete",
  "findOneAndReplace",
  "findOneAndUpdate",
  "updateMany",
  "updateOne"
];

export const applyRoleScope = (schema, role) => {
  schema.pre("save", function onSave(next) {
    this.role = role;
    next();
  });

  scopedQueryMethods.forEach((method) => {
    schema.pre(method, function onQuery(next) {
      this.where({ role });
      next();
    });
  });
};

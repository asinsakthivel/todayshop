import mongoose from "mongoose";

const orderStatusEnum = [
  "placed",
  "accepted",
  "packed",
  "readyForPickup",
  "READY_FOR_PICKUP",
  "assigned",
  "PICKUP_ASSIGNED",
  "pickupAssigned",
  "pickedUp",
  "PICKED_UP",
  "outForDelivery",
  "OUT_FOR_DELIVERY",
  "delivered",
  "DELIVERED",
  "cancelled"
];

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String,
  quantity: Number,
  price: Number,
  image: String
}, { _id: false });

const addressSnapshotSchema = new mongoose.Schema({
  label: String,
  fullName: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  pincode: String
}, { _id: false });

const statusSchema = new mongoose.Schema({
  status: { type: String, enum: orderStatusEnum },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  deliveryPartnerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  items: [orderItemSchema],
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: String,
  productImage: String,
  quantity: { type: Number, default: 1 },
  productPrice: { type: Number, default: 0 },
  subTotal: { type: Number, default: 0 },
  deliveryCharge: { type: Number, default: 10 },
  deliveryAddress: addressSnapshotSchema,
  customerName: String,
  address: String,
  phone: String,
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ["COD", "UPI", "Card"], required: true },
  paymentStatus: { type: String, default: "pending" },
  orderStatus: { type: String, enum: orderStatusEnum, default: "placed" },
  adminApproved: { type: Boolean, default: false },
  adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  adminApprovedAt: Date,
  adminRejectReason: String,
  statusHistory: [statusSchema],
  deliveredAt: Date,
  reviewSubmitted: { type: Boolean, default: false },
  reviewed: {
    seller: { type: Boolean, default: false },
    delivery: { type: Boolean, default: false }
  }
}, { timestamps: true });


export { orderStatusEnum };
export default mongoose.model("Order", orderSchema);

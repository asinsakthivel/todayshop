import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null
    },

    customerName: {
      type: String,
      default: ""
    },

    deliveryLocation: {
      type: String,
      default: ""
    },

    statusMessage: {
      type: String,
      default: ""
    },

    message: {
      type: String,
      required: true,
      trim: true
    },

    type: {
      type: String,
      enum: ["info", "order", "delivery", "review"],
      default: "info"
    },

    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);
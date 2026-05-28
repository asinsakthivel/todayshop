import Delivery from "../models/Delivery.js";
import User from "../models/User.js";

/**
 * Auto assign the first available verified delivery partner.
 * Marks partner as busy, creates Delivery document, and returns ids.
 */
export const assignDelivery = async ({ order, pickupAddress, dropAddress }) => {
  const partner = await User.findOneAndUpdate(
    { role: "deliveryPartner", isVerified: true, currentStatus: "available" },
    { currentStatus: "busy" },
    { new: true }
  ).lean();
  if (!partner) return null;

  const delivery = await Delivery.create({
    orderId: order._id,
    deliveryPartnerId: partner._id,
    pickupAddress,
    dropAddress,
    currentStatus: "READY_FOR_PICKUP",
    statusHistory: [{ status: "READY_FOR_PICKUP" }]
  });

  return { partnerId: partner._id, deliveryId: delivery._id };
};

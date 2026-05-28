const deliveryStatusMap = {
  placed: "Placed",
  accepted: "Accepted",
  packed: "Packed",
  readyForPickup: "Ready for Pickup",
  READY_FOR_PICKUP: "Ready for Pickup",
  assigned: "Ready for Pickup",
  pickupAssigned: "Pickup Assigned",
  PICKUP_ASSIGNED: "Pickup Assigned",
  pickedUp: "Picked Up",
  PICKED_UP: "Picked Up",
  outForDelivery: "Out for Delivery",
  OUT_FOR_DELIVERY: "Out for Delivery",
  delivered: "Delivered",
  DELIVERED: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected"
};

const normalizedStatusMap = {
  readyForPickup: "READY_FOR_PICKUP",
  READY_FOR_PICKUP: "READY_FOR_PICKUP",
  assigned: "READY_FOR_PICKUP",
  pickupAssigned: "PICKUP_ASSIGNED",
  PICKUP_ASSIGNED: "PICKUP_ASSIGNED",
  pickedUp: "PICKED_UP",
  PICKED_UP: "PICKED_UP",
  outForDelivery: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  delivered: "DELIVERED",
  DELIVERED: "DELIVERED"
};

export const timelineSteps = [
  "placed",
  "accepted",
  "packed",
  "READY_FOR_PICKUP",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED"
];

export const normalizeDeliveryStatus = (status = "") => normalizedStatusMap[status] || status;

export const getDeliveryStatusLabel = (status = "") => deliveryStatusMap[status] || status || "Pending";

export const getDeliveryStatusBadge = (status = "") => {
  switch (normalizeDeliveryStatus(status)) {
    case "READY_FOR_PICKUP":
      return "warning";
    case "PICKUP_ASSIGNED":
      return "info";
    case "PICKED_UP":
      return "primary";
    case "OUT_FOR_DELIVERY":
      return "dark";
    case "DELIVERED":
      return "success";
    default:
      return status === "cancelled" || status === "rejected" ? "danger" : "secondary";
  }
};

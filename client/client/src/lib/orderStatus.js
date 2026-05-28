const statusLabels = {
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
  DELIVERED: "DELIVERED",
  placed: "placed",
  accepted: "accepted",
  packed: "packed",
  cancelled: "cancelled"
};

const statusBadges = {
  placed: "primary",
  accepted: "info",
  packed: "info",
  READY_FOR_PICKUP: "warning",
  readyForPickup: "warning",
  assigned: "warning",
  PICKUP_ASSIGNED: "info",
  pickupAssigned: "info",
  PICKED_UP: "primary",
  pickedUp: "primary",
  OUT_FOR_DELIVERY: "dark",
  outForDelivery: "dark",
  DELIVERED: "success",
  delivered: "success",
  cancelled: "danger",
  rejected: "danger"
};

export const normalizeOrderStatus = (status = "") => {
  return normalizedStatusMap[status] || status;
};

export const getStatusLabel = (status = "") => {
  return statusLabels[status] || statusLabels[normalizeOrderStatus(status)] || status || "Pending";
};

export const getStatusBadge = (status = "") => {
  return statusBadges[status] || statusBadges[normalizeOrderStatus(status)] || "secondary";
};
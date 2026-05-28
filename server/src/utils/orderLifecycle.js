const statusAliases = {
  placed: "placed",
  accepted: "accepted",
  packed: "packed",
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
  cancelled: "cancelled"
};

export const normalizeOrderStatus = (status = "") => statusAliases[status] || status;

export const emitOrderUpdate = (req, userIds = [], payload = {}) => {
  const io = req.app.get("io");
  const userSockets = req.app.get("userSockets");
  if (!io || !userSockets) return;

  const targets = [...new Set(userIds.filter(Boolean).map((value) => value.toString()))];
  targets.forEach((userId) => {
    const socketId = userSockets.get(userId);
    if (socketId) io.to(socketId).emit("orderUpdate", payload);
  });

  // (No-op) Keeping function signature; actual notification refresh is handled
  // by the client calling /delivery/profile on relevant socket events.
};

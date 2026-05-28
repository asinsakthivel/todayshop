import Notification from "../models/Notification.js";

export const getMyNotifications = async (req, res) => {
  const notifications = await Notification.find({ userId: req.user.id })
    .sort({ isRead: 1, createdAt: -1 })
    .limit(20)
    .lean();

  res.json({
    unreadCount: notifications.filter((n) => !n.isRead).length,
    notifications: notifications.map((item) => ({
      id: item._id.toString(),
      message: item.message,
      statusMessage: item.statusMessage,
      orderId: item.orderId ? item.orderId.toString() : null,
      customerName: item.customerName,
      deliveryLocation: item.deliveryLocation,
      type: item.type,
      isRead: item.isRead,
      time: item.createdAt,
      createdAt: item.createdAt
    }))
  });
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  const updated = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user.id },
    { $set: { isRead: true } },
    { new: true }
  ).lean();

  if (!updated) return res.status(404).json({ message: "Notification not found" });

  const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

  res.json({
    success: true,
    unreadCount
  });
};

export const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, isRead: false }, { $set: { isRead: true } });
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
  res.json({ success: true, unreadCount });
};


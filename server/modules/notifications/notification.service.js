import Notification from "./notification.model.js";
import { createHttpError } from "../../utils/httpError.js";

export const getNotifications = async ({ user, query }) => {
  const pageSize = Math.min(Math.max(Number(query?.limit) || 10, 1), 50);
  const unreadOnly = String(query?.unreadOnly || "false") === "true";
  const filter = { userId: user.id };

  if (unreadOnly) {
    filter.readAt = null;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(pageSize).lean(),
    Notification.countDocuments({ userId: user.id, readAt: null }),
  ]);

  return {
    notifications,
    meta: {
      unreadCount,
      total: notifications.length,
    },
  };
};

export const markNotificationRead = async ({ id, user }) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: user.id },
    { $set: { readAt: new Date() } },
    { new: true }
  ).lean();

  if (!notification) {
    throw createHttpError(404, "Notification not found");
  }

  return notification;
};

export const markAllNotificationsRead = async ({ user }) => {
  const result = await Notification.updateMany(
    { userId: user.id, readAt: null },
    { $set: { readAt: new Date() } }
  );

  return {
    modifiedCount: result.modifiedCount || 0,
  };
};
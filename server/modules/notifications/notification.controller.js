import * as notificationService from "./notification.service.js";

export const getNotifications = async (req, res) => {
  const result = await notificationService.getNotifications({ user: req.user, query: req.query });
  res.json({ success: true, data: result.notifications, meta: result.meta });
};

export const markNotificationRead = async (req, res) => {
  const notification = await notificationService.markNotificationRead({ id: req.params.id, user: req.user });
  res.json({ success: true, message: "Notification marked as read", data: notification });
};

export const markAllNotificationsRead = async (req, res) => {
  const result = await notificationService.markAllNotificationsRead({ user: req.user });
  res.json({ success: true, message: "Notifications marked as read", data: result });
};
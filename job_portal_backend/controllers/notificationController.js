const Notification = require('../models/Notification');

const mapNotification = (notification) => ({
  id: notification._id,
  _id: notification._id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  readAt: notification.readAt,
  read: Boolean(notification.readAt),
  metadata: notification.metadata || {},
  createdAt: notification.createdAt,
});

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      notifications: notifications.map(mapNotification),
      unreadCount: notifications.filter((notification) => !notification.readAt).length,
    });
  } catch (error) {
    next(error);
  }
};

const markMyNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, notification: mapNotification(notification) });
  } catch (error) {
    next(error);
  }
};

const markAllMyNotificationsRead = async (req, res, next) => {
  try {
    const readAt = new Date();
    await Notification.updateMany({ userId: req.userId, readAt: null }, { readAt });

    res.status(200).json({ success: true, readAt });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAllMyNotificationsRead,
  markMyNotificationRead,
};

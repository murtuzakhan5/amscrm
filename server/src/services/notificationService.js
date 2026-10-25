import { Notification } from '../models/Notification.js';

let socketIoInstance = null;

export const setSocketInstance = (io) => {
  socketIoInstance = io;
};

export const createNotification = async ({
  recipient,
  title,
  message,
  type = 'system_alert',
  link = '',
  metadata = {},
}) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
      metadata,
    });

    if (socketIoInstance) {
      const room = `user:${recipient.toString()}`;
      socketIoInstance.to(room).emit('notification', notification);
    }

    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return null;
  }
};

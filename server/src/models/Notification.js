import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'lead_assigned',
        'lead_reassigned',
        'task_assigned',
        'task_due',
        'meeting_scheduled',
        'meeting_rescheduled',
        'follow_up_due',
        'client_call_scheduled',
        'system_alert',
      ],
      default: 'system_alert',
    },
    link: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = model('Notification', notificationSchema);

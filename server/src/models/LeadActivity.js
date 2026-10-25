import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const ACTIVITY_TYPES = [
  'created',
  'assigned',
  'reassigned',
  'status_change',
  'note_added',
  'call_logged',
  'follow_up_scheduled',
  'meeting_scheduled',
  'proposal_attached',
  'converted_to_client',
  'marked_in_future',
  'marked_won',
  'marked_lost',
];

const leadActivitySchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    activityType: {
      type: String,
      enum: ACTIVITY_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeadActivity = model('LeadActivity', leadActivitySchema);

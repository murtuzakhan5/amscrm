import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const leadFollowUpSchema = new Schema(
  {
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Follow-up title/purpose is required'],
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date & time is required'],
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'overdue'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
    outcomeNotes: {
      type: String,
      default: '',
    },
    completedAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const LeadFollowUp = model('LeadFollowUp', leadFollowUpSchema);

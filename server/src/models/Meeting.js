import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const MEETING_TYPES = [
  'client_call',
  'online_meeting',
  'physical_meeting',
  'internal_meeting',
  'follow_up_meeting',
];

export const MEETING_STATUSES = [
  'scheduled',
  'completed',
  'cancelled',
  'rescheduled',
  'no_show',
];

const meetingSchema = new Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
    },
    relatedLead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    relatedClient: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    meetingType: {
      type: String,
      enum: MEETING_TYPES,
      default: 'online_meeting',
      index: true,
    },
    startTimeUTC: {
      type: Date,
      required: [true, 'Start date & time in UTC is required'],
      index: true,
    },
    endTimeUTC: {
      type: Date,
      required: [true, 'End date & time in UTC is required'],
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi',
    },
    location: {
      type: String,
      default: '',
    },
    meetingLink: {
      type: String,
      default: '',
    },
    assignedEmployee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    participants: [
      {
        name: String,
        email: String,
        employee: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
      },
    ],
    agenda: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: MEETING_STATUSES,
      default: 'scheduled',
      index: true,
    },
    meetingNotes: {
      type: String,
      default: '',
    },
    meetingOutcome: {
      type: String,
      default: '',
    },
    nextAction: {
      type: String,
      default: '',
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

export const Meeting = model('Meeting', meetingSchema);

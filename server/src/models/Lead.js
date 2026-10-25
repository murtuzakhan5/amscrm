import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const LEAD_STATUSES = [
  'new_lead',
  'assigned',
  'contacted',
  'follow_up_required',
  'meeting_scheduled',
  'proposal_sent',
  'negotiation',
  'in_future_interested',
  'won',
  'lost',
];

export const LEAD_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

export const LEAD_SOURCES = [
  'Website Form',
  'LinkedIn',
  'Referral',
  'Cold Outreach',
  'Upwork',
  'Inbound Call',
  'Google Ads',
  'Other',
];

const leadSchema = new Schema(
  {
    leadId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    clientName: {
      type: String,
      required: [true, 'Client/Contact name is required'],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    whatsappNumber: {
      type: String,
      trim: true,
      default: '',
    },
    leadSource: {
      type: String,
      default: 'Website Form',
      index: true,
    },
    interestedService: {
      type: String,
      required: [true, 'Interested service is required'],
      default: 'Custom Software Development',
    },
    projectRequirements: {
      type: String,
      default: '',
    },
    estimatedBudget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    priority: {
      type: String,
      enum: LEAD_PRIORITIES,
      default: 'medium',
      index: true,
    },
    status: {
      type: String,
      enum: LEAD_STATUSES,
      default: 'new_lead',
      index: true,
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
      index: true,
    },
    futureFollowUpDate: {
      type: Date,
      default: null,
      index: true,
    },
    futureReason: {
      type: String,
      default: '',
    },
    lastContactDate: {
      type: Date,
      default: null,
    },
    notes: [
      {
        text: String,
        author: { type: Schema.Types.ObjectId, ref: 'User' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    lostReason: {
      type: String,
      default: '',
    },
    convertedClient: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

leadSchema.index({ clientName: 'text', companyName: 'text', email: 'text', leadId: 'text' });

export const Lead = model('Lead', leadSchema);

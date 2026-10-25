import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const DEAL_STAGES = [
  'qualification',
  'proposal_sent',
  'negotiation',
  'won',
  'lost',
];

const dealSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Deal title is required'],
      trim: true,
    },
    lead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
      index: true,
    },
    value: {
      type: Number,
      required: [true, 'Deal value is required'],
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    stage: {
      type: String,
      enum: DEAL_STAGES,
      default: 'qualification',
      index: true,
    },
    expectedCloseDate: {
      type: Date,
      required: true,
    },
    probability: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
    },
    status: {
      type: String,
      enum: ['open', 'won', 'lost'],
      default: 'open',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'partially_paid', 'fully_paid'],
      default: 'unpaid',
    },
    actualRevenueReceived: {
      type: Number,
      default: 0,
    },
    lostReason: {
      type: String,
      default: '',
    },
    notes: {
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

export const Deal = model('Deal', dealSchema);

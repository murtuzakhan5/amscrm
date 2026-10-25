import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const clientSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Client contact name is required'],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      trim: true,
      default: '',
      index: true,
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
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      postalCode: { type: String, default: '' },
    },
    services: [
      {
        type: String,
        trim: true,
      },
    ],
    accountManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      index: true,
    },
    convertedFromLead: {
      type: Schema.Types.ObjectId,
      ref: 'Lead',
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    nextFollowUpDate: {
      type: Date,
      default: null,
      index: true,
    },
    followUpReason: {
      type: String,
      trim: true,
      default: '',
    },
    followUpStatus: {
      type: String,
      enum: ['none', 'scheduled', 'completed', 'cancelled'],
      default: 'none',
      index: true,
    },
    followUps: [
      {
        scheduledDate: {
          type: Date,
          required: true,
        },
        title: {
          type: String,
          trim: true,
          default: 'Scheduled Call',
        },
        reason: {
          type: String,
          trim: true,
          default: '',
        },
        notes: {
          type: String,
          default: '',
        },
        status: {
          type: String,
          enum: ['pending', 'completed', 'cancelled'],
          default: 'pending',
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    clientNotes: [
      {
        text: {
          type: String,
          required: true,
          trim: true,
        },
        author: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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

clientSchema.index({ name: 'text', companyName: 'text', email: 'text' });

export const Client = model('Client', clientSchema);

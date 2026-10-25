import mongoose from 'mongoose';
const { Schema, model } = mongoose;

export const PROJECT_STATUSES = [
  'planning',
  'in_progress',
  'on_hold',
  'completed',
  'cancelled',
];

const projectSchema = new Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      index: true,
    },
    client: {
      type: Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    assignedTeam: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Employee',
      },
    ],
    projectManager: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline is required'],
      index: true,
    },
    budget: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'planning',
      index: true,
    },
    progressPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    deliverables: [
      {
        title: String,
        isCompleted: { type: Boolean, default: false },
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

export const Project = model('Project', projectSchema);

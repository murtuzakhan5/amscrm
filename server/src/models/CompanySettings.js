import mongoose from 'mongoose';
const { Schema, model } = mongoose;

const companySettingsSchema = new Schema(
  {
    companyName: {
      type: String,
      default: 'AMS Crafters',
    },
    companyEmail: {
      type: String,
      default: 'contact@amscrafters.com',
    },
    companyPhone: {
      type: String,
      default: '+92 300 1234567',
    },
    companyAddress: {
      type: String,
      default: 'Lahore, Pakistan',
    },
    workStartTime: {
      type: String,
      default: '09:00', // HH:mm in company timezone
    },
    workEndTime: {
      type: String,
      default: '18:00',
    },
    lateGracePeriodMinutes: {
      type: Number,
      default: 5,
    },
    timezone: {
      type: String,
      default: 'Asia/Karachi',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    departments: {
      type: [String],
      default: [
        'Executive & Management',
        'Sales & Business Development',
        'Graphic Designing & Creative Media',
        'Video Editing & Content Creation',
        'Team Leads & Management',
        'Custom Software Engineering',
        'Web & Mobile Development',
        'UI/UX Design',
        'Quality Assurance',
        'Operations & HR',
      ],
    },
    services: {
      type: [String],
      default: [
        'Custom Software Development',
        'Web Application Development',
        'Mobile App Development (iOS & Android)',
        'UI/UX Design & Prototyping',
        'Enterprise CRM & ERP Systems',
        'Cloud Solutions & DevOps',
        'Quality Assurance & Testing',
      ],
    },
  },
  {
    timestamps: true,
  }
);

export const CompanySettings = model('CompanySettings', companySettingsSchema);

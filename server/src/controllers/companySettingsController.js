import { CompanySettings } from '../models/CompanySettings.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';

export const getCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'AMS Crafters',
        companyEmail: 'contact@amscrafters.com',
        companyPhone: '+92 300 1234567',
        workStartTime: '09:00',
        workEndTime: '18:00',
        lateGracePeriodMinutes: 15,
        timezone: 'Asia/Karachi',
        currency: 'USD',
      });
    }
    return sendSuccess(res, { data: { settings } });
  } catch (error) {
    next(error);
  }
};

export const updateCompanySettings = async (req, res, next) => {
  try {
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      workStartTime,
      workEndTime,
      lateGracePeriodMinutes,
      timezone,
      currency,
      departments,
      services,
    } = req.body;

    if (companyName !== undefined) settings.companyName = companyName;
    if (companyEmail !== undefined) settings.companyEmail = companyEmail;
    if (companyPhone !== undefined) settings.companyPhone = companyPhone;
    if (companyAddress !== undefined) settings.companyAddress = companyAddress;
    if (workStartTime !== undefined) settings.workStartTime = workStartTime;
    if (workEndTime !== undefined) settings.workEndTime = workEndTime;
    if (lateGracePeriodMinutes !== undefined) settings.lateGracePeriodMinutes = lateGracePeriodMinutes;
    if (timezone !== undefined) settings.timezone = timezone;
    if (currency !== undefined) settings.currency = currency;
    if (departments !== undefined) settings.departments = departments;
    if (services !== undefined) settings.services = services;

    await settings.save();

    await logAudit({
      action: 'COMPANY_SETTINGS_UPDATED',
      entityType: 'CompanySettings',
      entityId: settings._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    return sendSuccess(res, {
      message: 'Company settings updated successfully.',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

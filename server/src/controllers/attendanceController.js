import { Attendance } from '../models/Attendance.js';
import { CompanySettings } from '../models/CompanySettings.js';
import { Employee } from '../models/Employee.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const checkIn = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendError(res, { statusCode: 400, message: 'Employee profile not associated with this account.' });
    }

    const todayStr = getTodayDateString();
    let record = await Attendance.findOne({ employee: employeeId, date: todayStr });

    if (record && record.checkInTime) {
      return sendError(res, { statusCode: 400, message: 'You have already checked in today.' });
    }

    // Load company settings & specific employee assigned shift timing
    const [settings, employee] = await Promise.all([
      CompanySettings.findOne(),
      Employee.findById(employeeId),
    ]);

    const activeSettings = settings || {
      workStartTime: '09:00',
      workEndTime: '18:00',
      lateGracePeriodMinutes: 5,
    };

    // Employee specific shift timing or fallback to company default
    const workStartTime = employee?.shiftStartTime?.trim() || activeSettings.workStartTime || '09:00';
    const graceMinutes =
      employee?.lateGracePeriodMinutes !== undefined &&
      employee?.lateGracePeriodMinutes !== null &&
      employee?.lateGracePeriodMinutes >= 0
        ? Number(employee.lateGracePeriodMinutes)
        : (activeSettings.lateGracePeriodMinutes ?? 5);

    const now = new Date();
    const [startHour, startMinute] = workStartTime.split(':').map(Number);
    const scheduledStart = new Date(now);
    scheduledStart.setHours(startHour, startMinute, 0, 0);

    // Exact Grace Limit (e.g. 5 minutes after shift start time)
    const graceLimit = new Date(scheduledStart.getTime() + graceMinutes * 60 * 1000);

    let status = 'present';
    let lateMinutes = 0;

    if (now > graceLimit) {
      status = 'late';
      lateMinutes = Math.max(0, Math.round((now - scheduledStart) / (1000 * 60)));
    }

    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    if (!record) {
      record = new Attendance({
        employee: employeeId,
        date: todayStr,
        checkInTime: now,
        status,
        lateMinutes,
        ipAddress,
      });
    } else {
      record.checkInTime = now;
      record.status = status;
      record.lateMinutes = lateMinutes;
      record.ipAddress = ipAddress;
    }

    await record.save();

    await logAudit({
      action: 'ATTENDANCE_CHECKIN',
      entityType: 'Attendance',
      entityId: record._id,
      performedBy: req.user._id,
      details: { status, lateMinutes, date: todayStr, scheduledStart: workStartTime, graceMinutes },
      req,
    });

    return sendSuccess(res, {
      message: `Check-in successful! ${status === 'late' ? `Marked Late (${lateMinutes} mins after ${workStartTime})` : 'Marked On-Time'}.`,
      data: { attendance: record },
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendError(res, { statusCode: 400, message: 'Employee profile not associated with this account.' });
    }

    const todayStr = getTodayDateString();
    const record = await Attendance.findOne({ employee: employeeId, date: todayStr });

    if (!record || !record.checkInTime) {
      return sendError(res, { statusCode: 400, message: 'You have not checked in today yet.' });
    }

    if (record.checkOutTime) {
      return sendError(res, { statusCode: 400, message: 'You have already checked out today.' });
    }

    const now = new Date();
    record.checkOutTime = now;

    // Calculate working hours in hours with 2 decimal places
    const diffMs = now - record.checkInTime;
    const workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    record.workingHours = workingHours;

    if (workingHours < 4 && record.status !== 'late') {
      record.status = 'half_day';
    }

    await record.save();

    await logAudit({
      action: 'ATTENDANCE_CHECKOUT',
      entityType: 'Attendance',
      entityId: record._id,
      performedBy: req.user._id,
      details: { workingHours, date: todayStr },
      req,
    });

    return sendSuccess(res, {
      message: `Check-out successful! Total time logged: ${workingHours} hours.`,
      data: { attendance: record },
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayStatus = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendSuccess(res, { data: { record: null } });
    }

    const todayStr = getTodayDateString();
    const record = await Attendance.findOne({ employee: employeeId, date: todayStr });

    return sendSuccess(res, {
      data: { record },
    });
  } catch (error) {
    next(error);
  }
};

export const getMyAttendance = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendSuccess(res, { data: [] });
    }

    const { month, year } = req.query;
    const query = { employee: employeeId };

    if (month && year) {
      const monthPadded = String(month).padStart(2, '0');
      query.date = { $regex: `^${year}-${monthPadded}` };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    return sendSuccess(res, { data: records });
  } catch (error) {
    next(error);
  }
};

export const getAllAttendance = async (req, res, next) => {
  try {
    const { date, department, status, page = 1, limit = 100 } = req.query;

    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;

    if (department) {
      const employees = await Employee.find({ department }).select('_id');
      filter.employee = { $in: employees.map((e) => e._id) };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [records, total] = await Promise.all([
      Attendance.find(filter)
        .populate('employee', 'fullName email employeeId department designation shiftStartTime shiftEndTime lateGracePeriodMinutes')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Attendance.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: records,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Attendance Analytics & Summary Report (Present, Late, On-Time %, Absent)
export const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const todayStr = getTodayDateString();

    const [totalActiveEmployees, todayRecords, statusBreakdown] = await Promise.all([
      Employee.countDocuments({ employmentStatus: 'active', isDeleted: false }),
      Attendance.find({ date: todayStr }).populate('employee', 'fullName department employeeId designation'),
      Attendance.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalLateMinutes: { $sum: '$lateMinutes' },
            totalHours: { $sum: '$workingHours' },
          },
        },
      ]),
    ]);

    const presentToday = todayRecords.filter((r) => r.status === 'present').length;
    const lateToday = todayRecords.filter((r) => r.status === 'late').length;
    const halfDayToday = todayRecords.filter((r) => r.status === 'half_day').length;
    const totalCheckedIn = todayRecords.length;
    const absentToday = Math.max(0, totalActiveEmployees - totalCheckedIn);
    const onTimeRate = totalCheckedIn > 0 ? Math.round((presentToday / totalCheckedIn) * 100) : 100;

    return sendSuccess(res, {
      data: {
        today: {
          totalActiveEmployees,
          totalCheckedIn,
          present: presentToday,
          late: lateToday,
          halfDay: halfDayToday,
          absent: absentToday,
          onTimeRate,
        },
        statusBreakdown,
        todayRecords,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin Manual Attendance Record / Override
export const recordManualAttendance = async (req, res, next) => {
  try {
    const { employeeId, date, status, checkInTime, checkOutTime, lateMinutes, notes } = req.body;

    if (!employeeId || !date) {
      return sendError(res, { statusCode: 400, message: 'Employee ID and date are required.' });
    }

    let record = await Attendance.findOne({ employee: employeeId, date });

    if (!record) {
      record = new Attendance({
        employee: employeeId,
        date,
        status: status || 'present',
        checkInTime: checkInTime ? new Date(checkInTime) : new Date(),
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        lateMinutes: lateMinutes !== undefined ? Number(lateMinutes) : 0,
        notes: notes || 'Manually recorded by Admin',
      });
    } else {
      if (status) record.status = status;
      if (checkInTime) record.checkInTime = new Date(checkInTime);
      if (checkOutTime) record.checkOutTime = new Date(checkOutTime);
      if (lateMinutes !== undefined) record.lateMinutes = Number(lateMinutes);
      if (notes) record.notes = notes;
    }

    if (record.checkInTime && record.checkOutTime) {
      const diffMs = record.checkOutTime - record.checkInTime;
      record.workingHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
    }

    await record.save();

    await logAudit({
      action: 'ATTENDANCE_MANUAL_OVERRIDE',
      entityType: 'Attendance',
      entityId: record._id,
      performedBy: req.user._id,
      details: { employeeId, date, status: record.status },
      req,
    });

    return sendSuccess(res, {
      message: 'Attendance record saved successfully.',
      data: { attendance: record },
    });
  } catch (error) {
    next(error);
  }
};

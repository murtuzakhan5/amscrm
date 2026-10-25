import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { Lead } from '../models/Lead.js';
import { Task } from '../models/Task.js';
import { Meeting } from '../models/Meeting.js';
import { Attendance } from '../models/Attendance.js';
import { Client } from '../models/Client.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';

export const getEmployees = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      department = '',
      status = '',
      role = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = { isDeleted: false };

    // Role-based visibility
    if (req.user.role === 'manager') {
      const currentEmployeeId = req.user.employee?._id || req.user.employee;
      filter.$or = [{ manager: currentEmployeeId }, { _id: currentEmployeeId }];
    } else if (req.user.role === 'employee') {
      const currentEmployeeId = req.user.employee?._id || req.user.employee;
      filter._id = currentEmployeeId;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
      ];
    }

    if (department) filter.department = department;
    if (status) filter.employmentStatus = status;
    if (role) filter.role = role;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [employees, total] = await Promise.all([
      Employee.find(filter)
        .populate('manager', 'fullName email employeeId')
        .populate('user', 'isActive lastLogin')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Employee.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: employees,
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

export const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('manager', 'fullName email designation employeeId')
      .populate('user', 'isActive lastLogin email');

    if (!employee || employee.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Employee not found.' });
    }

    // Role verification
    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      if (employee._id.toString() !== myId?.toString()) {
        return sendError(res, { statusCode: 403, message: 'Access denied to other employee records.' });
      }
    } else if (req.user.role === 'manager') {
      const myId = req.user.employee?._id || req.user.employee;
      const isSelf = employee._id.toString() === myId?.toString();
      const isManagerOf = employee.manager && employee.manager._id?.toString() === myId?.toString();
      if (!isSelf && !isManagerOf) {
        return sendError(res, { statusCode: 403, message: 'Access denied: not in your assigned team.' });
      }
    }

    // Aggregate key stats for profile overview
    const [leadsCount, tasksCount, meetingsCount, recentAttendance, assignedClients] = await Promise.all([
      Lead.countDocuments({ assignedTo: employee._id, isDeleted: false }),
      Task.countDocuments({ assignedTo: employee._id }),
      Meeting.countDocuments({ assignedEmployee: employee._id }),
      Attendance.find({ employee: employee._id }).sort({ date: -1 }).limit(7),
      Client.find({ accountManager: employee._id }).sort({ updatedAt: -1 }),
    ]);

    return sendSuccess(res, {
      data: {
        employee,
        clients: assignedClients,
        stats: {
          assignedLeads: leadsCount,
          assignedTasks: tasksCount,
          totalMeetings: meetingsCount,
          managedClients: assignedClients.length,
          recentAttendance,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createEmployee = async (req, res, next) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      department,
      designation,
      role = 'employee',
      manager = null,
      joiningDate = new Date(),
      employmentStatus = 'active',
      address,
      emergencyContact,
    } = req.body;

    if (!fullName || !email || !password || !department || !designation) {
      return sendError(res, {
        statusCode: 400,
        message: 'Full name, email, initial password, department, and designation are required.',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user or employee already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, {
        statusCode: 409,
        message: 'A user with this email address already exists.',
      });
    }

    const employeeId = await generateSequentialId(Employee, 'AMS-EMP');

    // Create user credentials
    const user = new User({
      email: normalizedEmail,
      password,
      role,
      isActive: employmentStatus === 'active' || employmentStatus === 'probation',
    });
    await user.save();

    // Create employee profile
    const employee = new Employee({
      employeeId,
      user: user._id,
      fullName,
      email: normalizedEmail,
      phoneNumber,
      department,
      designation,
      role,
      manager: manager || null,
      joiningDate,
      employmentStatus,
      address,
      emergencyContact,
    });
    await employee.save();

    // Link user to employee
    user.employee = employee._id;
    await user.save();

    await logAudit({
      action: 'EMPLOYEE_CREATED',
      entityType: 'Employee',
      entityId: employee._id,
      performedBy: req.user._id,
      details: { fullName, email: normalizedEmail, employeeId, role, department },
      req,
    });

    const populated = await Employee.findById(employee._id)
      .populate('manager', 'fullName email')
      .populate('user', 'isActive');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Employee account created successfully.',
      data: { employee: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      department,
      designation,
      role,
      manager,
      joiningDate,
      employmentStatus,
      address,
      emergencyContact,
    } = req.body;

    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Employee not found.' });
    }

    if (fullName !== undefined) employee.fullName = fullName;
    if (phoneNumber !== undefined) employee.phoneNumber = phoneNumber;
    if (department !== undefined) employee.department = department;
    if (designation !== undefined) employee.designation = designation;
    if (manager !== undefined) employee.manager = manager || null;
    if (joiningDate !== undefined) employee.joiningDate = joiningDate;
    if (address !== undefined) employee.address = address;
    if (emergencyContact !== undefined) employee.emergencyContact = emergencyContact;

    if (employmentStatus !== undefined) {
      employee.employmentStatus = employmentStatus;
      // Sync user active status
      const isActive = employmentStatus === 'active' || employmentStatus === 'probation';
      await User.findByIdAndUpdate(employee.user, { isActive });
    }

    if (role !== undefined && req.user.role === 'admin') {
      employee.role = role;
      await User.findByIdAndUpdate(employee.user, { role });
    }

    await employee.save();

    await logAudit({
      action: 'EMPLOYEE_UPDATED',
      entityType: 'Employee',
      entityId: employee._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Employee.findById(employee._id)
      .populate('manager', 'fullName email')
      .populate('user', 'isActive');

    return sendSuccess(res, {
      message: 'Employee updated successfully.',
      data: { employee: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active', 'inactive', 'terminated', 'resigned'

    const employee = await Employee.findById(id);
    if (!employee || employee.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Employee not found.' });
    }

    employee.employmentStatus = status;
    const isActive = status === 'active' || status === 'probation';

    await employee.save();
    await User.findByIdAndUpdate(employee.user, { isActive });

    await logAudit({
      action: 'EMPLOYEE_STATUS_CHANGED',
      entityType: 'Employee',
      entityId: employee._id,
      performedBy: req.user._id,
      details: { newStatus: status, isActive },
      req,
    });

    return sendSuccess(res, {
      message: `Employee marked as ${status}.`,
      data: { employee },
    });
  } catch (error) {
    next(error);
  }
};

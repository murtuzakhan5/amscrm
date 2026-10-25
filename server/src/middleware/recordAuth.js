import { Employee } from '../models/Employee.js';

export const getRecordFilter = async (user, fieldName = 'assignedTo') => {
  // Super Admin / Admin has unrestricted access to all company data
  if (user.role === 'admin') {
    return {};
  }

  const employeeId = user.employee?._id || user.employee;

  // Manager has access to their own records plus team members reporting to them
  if (user.role === 'manager') {
    if (!employeeId) return { [fieldName]: null };
    const teamEmployees = await Employee.find({
      $or: [{ manager: employeeId }, { _id: employeeId }],
    }).select('_id');
    const teamIds = teamEmployees.map((e) => e._id);
    return { [fieldName]: { $in: teamIds } };
  }

  // Employee role: strictly isolated to records assigned to their own employee ID
  if (!employeeId) {
    return { [fieldName]: null };
  }

  return { [fieldName]: employeeId };
};

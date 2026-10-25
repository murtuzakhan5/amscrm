import mongoose from 'mongoose';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';
import { Meeting } from '../models/Meeting.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { Deal } from '../models/Deal.js';
import { LeadFollowUp } from '../models/LeadFollowUp.js';
import { Attendance } from '../models/Attendance.js';
import { sendSuccess } from '../utils/responseHandler.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Run parallel aggregation queries for optimal performance
    const [
      totalEmployees,
      activeEmployees,
      leadCounts,
      todayMeetings,
      upcomingMeetings,
      pendingFollowups,
      pendingTasks,
      completedTasks,
      activeProjects,
      dealsAgg,
      leadsByMonth,
      leadsBySource,
      employeePerformance,
    ] = await Promise.all([
      Employee.countDocuments({ isDeleted: false }),
      Employee.countDocuments({ employmentStatus: 'active', isDeleted: false }),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, totalBudget: { $sum: '$estimatedBudget' } } },
      ]),
      Meeting.countDocuments({
        startTimeUTC: { $gte: todayStart, $lte: todayEnd },
      }),
      Meeting.countDocuments({
        startTimeUTC: { $gt: todayEnd },
        status: 'scheduled',
      }),
      LeadFollowUp.countDocuments({
        status: 'pending',
        scheduledDate: { $lte: todayEnd },
      }),
      Task.countDocuments({
        status: { $in: ['todo', 'in_progress', 'in_review'] },
      }),
      Task.countDocuments({
        status: 'completed',
      }),
      Project.countDocuments({
        status: { $in: ['planning', 'in_progress'] },
      }),
      Deal.aggregate([
        {
          $group: {
            _id: null,
            totalDealValue: { $sum: '$value' },
            wonDealValue: {
              $sum: { $cond: [{ $eq: ['$status', 'won'] }, '$value', 0] },
            },
            actualRevenueReceived: { $sum: '$actualRevenueReceived' },
          },
        },
      ]),
      // Monthly Lead Growth aggregation for the last 6 months
      Lead.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: { $gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            wonCount: {
              $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Leads by Source
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$leadSource', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      // Top Employee Performance
      Lead.aggregate([
        { $match: { isDeleted: false, assignedTo: { $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            assignedCount: { $sum: 1 },
            wonCount: { $sum: { $cond: [{ $eq: ['$status', 'won'] }, 1, 0] } },
          },
        },
        { $limit: 10 },
      ]),
    ]);

    // Map lead counts into an accessible object
    const statusMap = {
      new_lead: 0,
      assigned: 0,
      contacted: 0,
      follow_up_required: 0,
      meeting_scheduled: 0,
      proposal_sent: 0,
      negotiation: 0,
      in_future_interested: 0,
      won: 0,
      lost: 0,
    };
    let totalLeads = 0;
    leadCounts.forEach((item) => {
      if (statusMap[item._id] !== undefined) {
        statusMap[item._id] = item.count;
      }
      totalLeads += item.count;
    });

    const leadsInProgress =
      statusMap.assigned +
      statusMap.contacted +
      statusMap.follow_up_required +
      statusMap.meeting_scheduled +
      statusMap.proposal_sent +
      statusMap.negotiation;

    const conversionRate = totalLeads > 0 ? ((statusMap.won / totalLeads) * 100).toFixed(1) : 0;

    // Populate employee details for top performance chart
    const populatedPerformance = await Employee.populate(employeePerformance, {
      path: '_id',
      select: 'fullName designation department',
    });

    const performanceFormatted = populatedPerformance
      .filter((p) => p._id)
      .map((p) => ({
        employeeName: p._id.fullName,
        department: p._id.department,
        assignedLeads: p.assignedCount,
        wonLeads: p.wonCount,
        conversionRate: p.assignedCount > 0 ? Math.round((p.wonCount / p.assignedCount) * 100) : 0,
      }));

    // Format Monthly Lead Growth for Recharts
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyFormatted = leadsByMonth.map((item) => ({
      month: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      totalLeads: item.count,
      wonLeads: item.wonCount,
    }));

    // Recent items for dashboard feed
    const [recentLeads, upcomingMeetingsList, recentTasks] = await Promise.all([
      Lead.find({ isDeleted: false })
        .populate('assignedTo', 'fullName')
        .sort({ createdAt: -1 })
        .limit(5),
      Meeting.find({ startTimeUTC: { $gte: todayStart } })
        .populate('assignedEmployee', 'fullName')
        .sort({ startTimeUTC: 1 })
        .limit(5),
      Task.find({ status: { $ne: 'completed' } })
        .populate('assignedTo', 'fullName')
        .sort({ dueDate: 1 })
        .limit(5),
    ]);

    const dealStats = dealsAgg[0] || {
      totalDealValue: 0,
      wonDealValue: 0,
      actualRevenueReceived: 0,
    };

    return sendSuccess(res, {
      data: {
        cards: {
          totalEmployees,
          activeEmployees,
          totalLeads,
          newLeads: statusMap.new_lead,
          leadsInProgress,
          convertedLeads: statusMap.won,
          lostLeads: statusMap.lost,
          futureLeads: statusMap.in_future_interested,
          conversionRate,
          todayMeetings,
          upcomingMeetings,
          pendingFollowups,
          pendingTasks,
          completedTasks,
          activeProjects,
          totalDealValue: dealStats.totalDealValue,
          wonDealValue: dealStats.wonDealValue,
          actualRevenueReceived: dealStats.actualRevenueReceived,
        },
        charts: {
          monthlyGrowth: monthlyFormatted,
          leadsBySource: leadsBySource.map((s) => ({ name: s._id || 'Unknown', value: s.count })),
          leadsByStatus: Object.keys(statusMap).map((k) => ({
            status: k.replace('_', ' ').toUpperCase(),
            count: statusMap[k],
          })),
          employeePerformance: performanceFormatted,
        },
        recent: {
          leads: recentLeads,
          meetings: upcomingMeetingsList,
          tasks: recentTasks,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeDashboardStats = async (req, res, next) => {
  try {
    const employeeId = req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendSuccess(res, { data: null });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayStr = `${todayStart.getFullYear()}-${String(todayStart.getMonth() + 1).padStart(2, '0')}-${String(todayStart.getDate()).padStart(2, '0')}`;

    const [myLeads, myTasks, myMeetings, todayAttendance] = await Promise.all([
      Lead.find({ assignedTo: employeeId, isDeleted: false }).sort({ updatedAt: -1 }),
      Task.find({ assignedTo: employeeId }).sort({ dueDate: 1 }),
      Meeting.find({ assignedEmployee: employeeId, startTimeUTC: { $gte: todayStart } }).sort({ startTimeUTC: 1 }),
      Attendance.findOne({ employee: employeeId, date: todayStr }),
    ]);

    const activeTasks = myTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled');
    const completedTasks = myTasks.filter((t) => t.status === 'completed');

    return sendSuccess(res, {
      data: {
        cards: {
          totalAssignedLeads: myLeads.length,
          wonLeads: myLeads.filter((l) => l.status === 'won').length,
          activeTasks: activeTasks.length,
          completedTasks: completedTasks.length,
          todayMeetingsCount: myMeetings.filter((m) => m.startTimeUTC <= todayEnd).length,
        },
        attendanceToday: todayAttendance,
        recentLeads: myLeads.slice(0, 5),
        myTasks: myTasks.slice(0, 8),
        myMeetings: myMeetings.slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getManagerDashboardStats = async (req, res, next) => {
  try {
    const managerEmpId = req.user.employee?._id || req.user.employee;
    const teamEmployees = await Employee.find({
      $or: [{ manager: managerEmpId }, { _id: managerEmpId }],
      isDeleted: false,
    });
    const teamIds = teamEmployees.map((e) => e._id);

    const [teamLeads, teamTasks, teamMeetings] = await Promise.all([
      Lead.find({ assignedTo: { $in: teamIds }, isDeleted: false }),
      Task.find({ assignedTo: { $in: teamIds } }),
      Meeting.find({ assignedEmployee: { $in: teamIds } }),
    ]);

    return sendSuccess(res, {
      data: {
        teamMembersCount: teamEmployees.length,
        totalTeamLeads: teamLeads.length,
        wonTeamLeads: teamLeads.filter((l) => l.status === 'won').length,
        pendingTeamTasks: teamTasks.filter((t) => t.status !== 'completed').length,
        completedTeamTasks: teamTasks.filter((t) => t.status === 'completed').length,
        teamMeetingsCount: teamMeetings.length,
        teamMembers: teamEmployees,
      },
    });
  } catch (error) {
    next(error);
  }
};

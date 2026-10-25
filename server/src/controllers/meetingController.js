import { Meeting, MEETING_TYPES, MEETING_STATUSES } from '../models/Meeting.js';
import { Employee } from '../models/Employee.js';
import { Lead } from '../models/Lead.js';
import { LeadActivity } from '../models/LeadActivity.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getRecordFilter } from '../middleware/recordAuth.js';

export const getMeetings = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      meetingType = '',
      status = '',
      assignedEmployee = '',
      startDate = '',
      endDate = '',
      sortBy = 'startTimeUTC',
      sortOrder = 'asc',
    } = req.query;

    const baseFilter = await getRecordFilter(req.user, 'assignedEmployee');
    const filter = { ...baseFilter };

    if (meetingType) filter.meetingType = meetingType;
    if (status) filter.status = status;
    if (assignedEmployee && (req.user.role === 'admin' || req.user.role === 'manager')) {
      filter.assignedEmployee = assignedEmployee;
    }

    if (startDate || endDate) {
      filter.startTimeUTC = {};
      if (startDate) filter.startTimeUTC.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.startTimeUTC.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .populate('assignedEmployee', 'fullName email employeeId')
        .populate('relatedLead', 'clientName companyName leadId email')
        .populate('relatedClient', 'name companyName email')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Meeting.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: meetings,
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

export const getCalendarEvents = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const baseFilter = await getRecordFilter(req.user, 'assignedEmployee');
    const filter = { ...baseFilter };

    if (start && end) {
      filter.startTimeUTC = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const meetings = await Meeting.find(filter)
      .populate('assignedEmployee', 'fullName email')
      .populate('relatedLead', 'clientName companyName')
      .populate('relatedClient', 'name companyName');

    // Format events for FullCalendar
    const events = meetings.map((m) => {
      let color = '#2563EB'; // default blue
      if (m.status === 'completed') color = '#16A34A'; // green
      else if (m.status === 'cancelled') color = '#DC2626'; // red
      else if (m.status === 'rescheduled') color = '#F59E0B'; // amber

      return {
        id: m._id,
        title: `${m.title} (${m.assignedEmployee?.fullName || 'Assigned'})`,
        start: m.startTimeUTC,
        end: m.endTimeUTC,
        backgroundColor: color,
        borderColor: color,
        extendedProps: {
          meetingId: m.meetingId,
          meetingType: m.meetingType,
          status: m.status,
          location: m.location,
          meetingLink: m.meetingLink,
          lead: m.relatedLead,
          client: m.relatedClient,
          agenda: m.agenda,
          outcome: m.meetingOutcome,
        },
      };
    });

    return sendSuccess(res, { data: events });
  } catch (error) {
    next(error);
  }
};

export const getMeetingById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate('assignedEmployee', 'fullName email employeeId')
      .populate('relatedLead', 'clientName companyName leadId email phoneNumber')
      .populate('relatedClient', 'name companyName email phoneNumber')
      .populate('createdBy', 'email');

    if (!meeting) {
      return sendError(res, { statusCode: 404, message: 'Meeting not found.' });
    }

    return sendSuccess(res, { data: { meeting } });
  } catch (error) {
    next(error);
  }
};

export const createMeeting = async (req, res, next) => {
  try {
    const {
      title,
      relatedLead,
      relatedClient,
      meetingType = 'online_meeting',
      startTimeUTC,
      endTimeUTC,
      timezone = 'Asia/Karachi',
      location = '',
      meetingLink = '',
      assignedEmployee,
      participants = [],
      agenda = '',
    } = req.body;

    if (!title || !startTimeUTC || !endTimeUTC) {
      return sendError(res, {
        statusCode: 400,
        message: 'Title, start time, and end time are required.',
      });
    }

    const startDateTime = new Date(startTimeUTC);
    const endDateTime = new Date(endTimeUTC);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return sendError(res, {
        statusCode: 400,
        message: 'Invalid meeting start or end date/time format.',
      });
    }

    if (startDateTime >= endDateTime) {
      return sendError(res, {
        statusCode: 400,
        message: 'Meeting end time must be after start time.',
      });
    }

    const employeeId = assignedEmployee || req.user.employee?._id || req.user.employee;
    if (!employeeId) {
      return sendError(res, {
        statusCode: 400,
        message: 'Assigned employee is required for scheduling a meeting.',
      });
    }

    // MANDATORY 2-HOUR BUFFER VALIDATION
    // Any meeting for the same employee must have at least 2 hours of buffer gap
    const BUFFER_MS = 2 * 60 * 60 * 1000; // 2 hours in ms
    const bufferedWindowStart = new Date(startDateTime.getTime() - BUFFER_MS);
    const bufferedWindowEnd = new Date(endDateTime.getTime() + BUFFER_MS);

    const conflictingMeeting = await Meeting.findOne({
      assignedEmployee: employeeId,
      status: { $nin: ['cancelled'] },
      $and: [
        { startTimeUTC: { $lt: bufferedWindowEnd } },
        { endTimeUTC: { $gt: bufferedWindowStart } },
      ],
    }).populate('assignedEmployee', 'fullName');

    if (conflictingMeeting) {
      const empName = conflictingMeeting.assignedEmployee?.fullName || 'The selected agent';
      const conflictStart = new Date(conflictingMeeting.startTimeUTC).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const conflictEnd = new Date(conflictingMeeting.endTimeUTC).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      const conflictDate = new Date(conflictingMeeting.startTimeUTC).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
      const earliestAvailable = new Date(
        new Date(conflictingMeeting.endTimeUTC).getTime() + BUFFER_MS
      ).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      return sendError(res, {
        statusCode: 409,
        message: `Schedule Conflict: ${empName} already has "${conflictingMeeting.title}" on ${conflictDate} (${conflictStart} - ${conflictEnd}). Company policy mandates at least a 2-hour preparation gap between meetings. Earliest available slot is after ${earliestAvailable}.`,
      });
    }

    const meetingId = await generateSequentialId(Meeting, 'AMS-MTG');

    const meeting = new Meeting({
      meetingId,
      title,
      relatedLead: relatedLead || null,
      relatedClient: relatedClient || null,
      meetingType,
      startTimeUTC: startDateTime,
      endTimeUTC: endDateTime,
      timezone,
      location,
      meetingLink,
      assignedEmployee: employeeId,
      participants,
      agenda,
      status: 'scheduled',
      createdBy: req.user._id,
    });

    await meeting.save();

    // If linked to lead, update lead status & log activity
    if (relatedLead) {
      const lead = await Lead.findById(relatedLead);
      if (lead) {
        if (lead.status !== 'won' && lead.status !== 'lost') {
          lead.status = 'meeting_scheduled';
          await lead.save();
        }

        await LeadActivity.create({
          lead: lead._id,
          activityType: 'meeting_scheduled',
          title: `Meeting Scheduled: ${title}`,
          description: `${meetingType.replace('_', ' ')} on ${new Date(startTimeUTC).toLocaleString()}`,
          metadata: { meetingId: meeting._id, meetingLink },
          performedBy: req.user._id,
        });
      }
    }

    // In-app notification to assigned employee
    const assignedEmp = await Employee.findById(employeeId).populate('user');
    if (assignedEmp && assignedEmp.user) {
      await createNotification({
        recipient: assignedEmp.user._id,
        title: 'New Meeting Scheduled',
        message: `Meeting "${title}" scheduled for ${new Date(startTimeUTC).toLocaleString()}`,
        type: 'meeting_scheduled',
        link: '/meetings',
      });
    }

    await logAudit({
      action: 'MEETING_CREATED',
      entityType: 'Meeting',
      entityId: meeting._id,
      performedBy: req.user._id,
      details: { meetingId, title, startTimeUTC },
      req,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate('assignedEmployee', 'fullName email')
      .populate('relatedLead', 'clientName companyName');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Meeting scheduled successfully.',
      data: { meeting: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id);

    if (!meeting) {
      return sendError(res, { statusCode: 404, message: 'Meeting not found.' });
    }

    const {
      title,
      meetingType,
      startTimeUTC,
      endTimeUTC,
      timezone,
      location,
      meetingLink,
      assignedEmployee,
      participants,
      agenda,
      status,
      meetingNotes,
      meetingOutcome,
      nextAction,
    } = req.body;

    const targetEmployeeId = assignedEmployee || meeting.assignedEmployee;
    const targetStart = startTimeUTC ? new Date(startTimeUTC) : meeting.startTimeUTC;
    const targetEnd = endTimeUTC ? new Date(endTimeUTC) : meeting.endTimeUTC;

    if (startTimeUTC || endTimeUTC) {
      if (isNaN(targetStart.getTime()) || isNaN(targetEnd.getTime())) {
        return sendError(res, {
          statusCode: 400,
          message: 'Invalid meeting start or end date/time format.',
        });
      }
      if (targetStart >= targetEnd) {
        return sendError(res, {
          statusCode: 400,
          message: 'Meeting end time must be after start time.',
        });
      }
    }

    // If time or employee changed, check 2-hour buffer conflict
    if ((startTimeUTC || endTimeUTC || assignedEmployee) && status !== 'cancelled') {
      const BUFFER_MS = 2 * 60 * 60 * 1000;
      const bufferedWindowStart = new Date(targetStart.getTime() - BUFFER_MS);
      const bufferedWindowEnd = new Date(targetEnd.getTime() + BUFFER_MS);

      const conflictingMeeting = await Meeting.findOne({
        _id: { $ne: meeting._id },
        assignedEmployee: targetEmployeeId,
        status: { $nin: ['cancelled'] },
        $and: [
          { startTimeUTC: { $lt: bufferedWindowEnd } },
          { endTimeUTC: { $gt: bufferedWindowStart } },
        ],
      }).populate('assignedEmployee', 'fullName');

      if (conflictingMeeting) {
        const empName = conflictingMeeting.assignedEmployee?.fullName || 'The selected agent';
        const conflictStart = new Date(conflictingMeeting.startTimeUTC).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const conflictEnd = new Date(conflictingMeeting.endTimeUTC).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        const conflictDate = new Date(conflictingMeeting.startTimeUTC).toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
        });
        const earliestAvailable = new Date(
          new Date(conflictingMeeting.endTimeUTC).getTime() + BUFFER_MS
        ).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        return sendError(res, {
          statusCode: 409,
          message: `Schedule Conflict: ${empName} already has "${conflictingMeeting.title}" on ${conflictDate} (${conflictStart} - ${conflictEnd}). Company policy mandates at least a 2-hour preparation gap between meetings. Earliest available slot is after ${earliestAvailable}.`,
        });
      }
    }

    if (title !== undefined) meeting.title = title;
    if (meetingType !== undefined) meeting.meetingType = meetingType;
    if (startTimeUTC !== undefined) meeting.startTimeUTC = targetStart;
    if (endTimeUTC !== undefined) meeting.endTimeUTC = targetEnd;
    if (timezone !== undefined) meeting.timezone = timezone;
    if (location !== undefined) meeting.location = location;
    if (meetingLink !== undefined) meeting.meetingLink = meetingLink;
    if (assignedEmployee !== undefined) meeting.assignedEmployee = assignedEmployee;
    if (participants !== undefined) meeting.participants = participants;
    if (agenda !== undefined) meeting.agenda = agenda;
    if (status !== undefined) meeting.status = status;
    if (meetingNotes !== undefined) meeting.meetingNotes = meetingNotes;
    if (meetingOutcome !== undefined) meeting.meetingOutcome = meetingOutcome;
    if (nextAction !== undefined) meeting.nextAction = nextAction;

    await meeting.save();

    await logAudit({
      action: 'MEETING_UPDATED',
      entityType: 'Meeting',
      entityId: meeting._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate('assignedEmployee', 'fullName email')
      .populate('relatedLead', 'clientName companyName');

    return sendSuccess(res, {
      message: 'Meeting updated successfully.',
      data: { meeting: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMeetingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, meetingOutcome = '', meetingNotes = '', nextAction = '' } = req.body;

    if (!MEETING_STATUSES.includes(status)) {
      return sendError(res, { statusCode: 400, message: 'Invalid meeting status.' });
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return sendError(res, { statusCode: 404, message: 'Meeting not found.' });
    }

    meeting.status = status;
    if (meetingOutcome) meeting.meetingOutcome = meetingOutcome;
    if (meetingNotes) meeting.meetingNotes = meetingNotes;
    if (nextAction) meeting.nextAction = nextAction;

    await meeting.save();

    return sendSuccess(res, {
      message: `Meeting marked as ${status}.`,
      data: { meeting },
    });
  } catch (error) {
    next(error);
  }
};

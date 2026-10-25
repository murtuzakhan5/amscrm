import { Client } from '../models/Client.js';
import { Project } from '../models/Project.js';
import { Deal } from '../models/Deal.js';
import { Meeting } from '../models/Meeting.js';
import { Lead } from '../models/Lead.js';
import { Employee } from '../models/Employee.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';
import { createNotification } from '../services/notificationService.js';
import { getRecordFilter } from '../middleware/recordAuth.js';

export const getClients = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      hasFollowUp = '',
      accountManager = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const baseFilter = await getRecordFilter(req.user, 'accountManager');
    const filter = { ...baseFilter };

    if (status) filter.status = status;
    if (hasFollowUp === 'true') {
      filter.nextFollowUpDate = { $ne: null };
    }
    if (accountManager && req.user.role !== 'employee') {
      filter.accountManager = accountManager;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [clients, total] = await Promise.all([
      Client.find(filter)
        .populate('accountManager', 'fullName email employeeId')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Client.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: clients,
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

export const getClientCalendar = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    const filter = {};

    if (start && end) {
      filter.createdAt = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const clients = await Client.find(filter)
      .populate('accountManager', 'fullName email employeeId')
      .populate('convertedFromLead', 'leadId clientName')
      .sort({ createdAt: -1 });

    // Group clients by YYYY-MM-DD
    const dateMap = {};
    clients.forEach((c) => {
      const d = new Date(c.createdAt);
      const dateStr = d.toISOString().split('T')[0];
      if (!dateMap[dateStr]) {
        dateMap[dateStr] = [];
      }
      dateMap[dateStr].push(c);
    });

    // Format events for FullCalendar
    const events = Object.entries(dateMap).map(([dateStr, clientList]) => {
      const count = clientList.length;
      return {
        id: `client-onboard-${dateStr}`,
        title: `${count} Client${count > 1 ? 's' : ''} Onboarded`,
        start: dateStr,
        allDay: true,
        backgroundColor: '#16A34A', // Success green
        borderColor: '#15803D',
        textColor: '#FFFFFF',
        extendedProps: {
          type: 'onboarding',
          date: dateStr,
          count,
          clients: clientList.map((c) => ({
            _id: c._id,
            name: c.name,
            companyName: c.companyName,
            email: c.email,
            phoneNumber: c.phoneNumber,
            status: c.status,
            accountManager: c.accountManager?.fullName || 'Direct',
            services: c.services || [],
            createdAt: c.createdAt,
            leadId: c.convertedFromLead?.leadId || null,
          })),
        },
      };
    });

    // Also include scheduled follow-up calls on calendar
    const callFilter = { nextFollowUpDate: { $ne: null } };
    if (start && end) {
      callFilter.nextFollowUpDate = {
        $gte: new Date(start),
        $lte: new Date(end),
      };
    }

    const clientsWithCalls = await Client.find(callFilter)
      .populate('accountManager', 'fullName email')
      .sort({ nextFollowUpDate: 1 });

    clientsWithCalls.forEach((c) => {
      const callDateStr = new Date(c.nextFollowUpDate).toISOString().split('T')[0];
      events.push({
        id: `client-call-${c._id}`,
        title: `📞 Call: ${c.name} (${c.followUpReason || 'Follow-up'})`,
        start: callDateStr,
        allDay: true,
        backgroundColor: '#D97706', // Amber / Orange
        borderColor: '#B45309',
        textColor: '#FFFFFF',
        extendedProps: {
          type: 'follow_up_call',
          date: callDateStr,
          client: {
            _id: c._id,
            name: c.name,
            companyName: c.companyName,
            email: c.email,
            phoneNumber: c.phoneNumber,
            status: c.status,
            followUpReason: c.followUpReason,
            accountManager: c.accountManager?.fullName || 'Direct',
          },
        },
      });
    });

    return sendSuccess(res, {
      data: events,
      meta: {
        totalClients: clients.length,
        daysWithOnboarding: Object.keys(dateMap).length,
        scheduledCalls: clientsWithCalls.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findById(id)
      .populate('accountManager', 'fullName email employeeId phoneNumber designation')
      .populate('convertedFromLead')
      .populate('followUps.createdBy', 'email fullName')
      .populate('clientNotes.author', 'email fullName');

    if (!client) {
      return sendError(res, { statusCode: 404, message: 'Client not found.' });
    }

    const [projects, deals, meetings] = await Promise.all([
      Project.find({ client: client._id }).populate('projectManager', 'fullName'),
      Deal.find({ client: client._id }).populate('owner', 'fullName'),
      Meeting.find({ relatedClient: client._id }).populate('assignedEmployee', 'fullName'),
    ]);

    return sendSuccess(res, {
      data: {
        client,
        projects,
        deals,
        meetings,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req, res, next) => {
  try {
    const {
      name,
      companyName,
      email,
      phoneNumber,
      address,
      services,
      accountManager,
      notes,
      nextFollowUpDate,
      followUpReason,
    } = req.body;

    if (!name || !email) {
      return sendError(res, { statusCode: 400, message: 'Client name and email are required.' });
    }

    // If an employee is creating the client, default accountManager to that employee if not provided
    const userEmpId = req.user.employee?._id || req.user.employee;
    const resolvedAccountManager = accountManager || (req.user.role === 'employee' ? userEmpId : null);

    const followUps = [];
    if (nextFollowUpDate) {
      followUps.push({
        scheduledDate: new Date(nextFollowUpDate),
        title: 'Initial Follow-up Call',
        reason: followUpReason || 'Client requested call-back',
        status: 'pending',
        createdBy: req.user._id,
        createdAt: new Date(),
      });
    }

    const client = await Client.create({
      name,
      companyName: companyName || '',
      email: email.toLowerCase().trim(),
      phoneNumber: phoneNumber || '',
      address: address || {},
      services: services || [],
      accountManager: resolvedAccountManager,
      notes: notes || '',
      nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
      followUpReason: followUpReason || '',
      followUpStatus: nextFollowUpDate ? 'scheduled' : 'none',
      followUps,
      createdBy: req.user._id,
    });

    await logAudit({
      action: 'CLIENT_CREATED',
      entityType: 'Client',
      entityId: client._id,
      performedBy: req.user._id,
      details: { name, companyName, email, accountManager: resolvedAccountManager },
      req,
    });

    const populated = await Client.findById(client._id).populate('accountManager', 'fullName email');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Client created successfully.',
      data: { client: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const client = await Client.findById(id);

    if (!client) {
      return sendError(res, { statusCode: 404, message: 'Client not found.' });
    }

    const {
      name,
      companyName,
      email,
      phoneNumber,
      address,
      services,
      accountManager,
      status,
      notes,
      nextFollowUpDate,
      followUpReason,
      followUpStatus,
    } = req.body;

    if (name !== undefined) client.name = name;
    if (companyName !== undefined) client.companyName = companyName;
    if (email !== undefined) client.email = email.toLowerCase().trim();
    if (phoneNumber !== undefined) client.phoneNumber = phoneNumber;
    if (address !== undefined) client.address = address;
    if (services !== undefined) client.services = services;
    if (accountManager !== undefined) client.accountManager = accountManager || null;
    if (status !== undefined) client.status = status;
    if (notes !== undefined) client.notes = notes;
    if (nextFollowUpDate !== undefined) client.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
    if (followUpReason !== undefined) client.followUpReason = followUpReason;
    if (followUpStatus !== undefined) client.followUpStatus = followUpStatus;

    await client.save();

    await logAudit({
      action: 'CLIENT_UPDATED',
      entityType: 'Client',
      entityId: client._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Client.findById(client._id).populate('accountManager', 'fullName email');

    return sendSuccess(res, {
      message: 'Client updated successfully.',
      data: { client: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const scheduleClientCall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { followUpDate, reason = '', title = 'Scheduled Call', notes = '' } = req.body;

    if (!followUpDate) {
      return sendError(res, { statusCode: 400, message: 'Follow-up date is required.' });
    }

    const client = await Client.findById(id);
    if (!client) {
      return sendError(res, { statusCode: 404, message: 'Client not found.' });
    }

    const scheduledDate = new Date(followUpDate);
    if (isNaN(scheduledDate.getTime())) {
      return sendError(res, { statusCode: 400, message: 'Invalid follow-up date format.' });
    }

    client.nextFollowUpDate = scheduledDate;
    client.followUpReason = reason;
    client.followUpStatus = 'scheduled';

    client.followUps.push({
      scheduledDate,
      title: title || 'Scheduled Call-back',
      reason,
      notes,
      status: 'pending',
      createdBy: req.user._id,
      createdAt: new Date(),
    });

    await client.save();

    // In-app notification to account manager
    if (client.accountManager) {
      const emp = await Employee.findById(client.accountManager).populate('user');
      if (emp && emp.user) {
        await createNotification({
          recipient: emp.user._id,
          title: `Call Scheduled with ${client.name}`,
          message: `Scheduled for ${scheduledDate.toLocaleDateString()}. Reason: ${reason || 'Follow-up call'}`,
          type: 'client_call_scheduled',
          link: `/clients/${client._id}`,
        });
      }
    }

    await logAudit({
      action: 'CLIENT_CALL_SCHEDULED',
      entityType: 'Client',
      entityId: client._id,
      performedBy: req.user._id,
      details: { scheduledDate, reason },
      req,
    });

    const populated = await Client.findById(client._id)
      .populate('accountManager', 'fullName email')
      .populate('followUps.createdBy', 'fullName email')
      .populate('clientNotes.author', 'fullName email');

    return sendSuccess(res, {
      message: 'Call-back scheduled successfully.',
      data: { client: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const addClientNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return sendError(res, { statusCode: 400, message: 'Note text is required.' });
    }

    const client = await Client.findById(id);
    if (!client) {
      return sendError(res, { statusCode: 404, message: 'Client not found.' });
    }

    client.clientNotes.push({
      text: text.trim(),
      author: req.user._id,
      createdAt: new Date(),
    });

    await client.save();

    const populated = await Client.findById(client._id)
      .populate('accountManager', 'fullName email')
      .populate('followUps.createdBy', 'fullName email')
      .populate('clientNotes.author', 'fullName email');

    return sendSuccess(res, {
      message: 'Note added to client timeline.',
      data: { client: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const completeClientFollowUp = async (req, res, next) => {
  try {
    const { id, followUpId } = req.params;
    const { status = 'completed', outcomeNotes = '' } = req.body;

    const client = await Client.findById(id);
    if (!client) {
      return sendError(res, { statusCode: 404, message: 'Client not found.' });
    }

    const fu = client.followUps.id(followUpId);
    if (fu) {
      fu.status = status;
      if (outcomeNotes) {
        fu.notes = (fu.notes ? fu.notes + '\n' : '') + `Outcome: ${outcomeNotes}`;
      }
    }

    // Check if there are remaining pending follow-ups
    const remainingPending = client.followUps
      .filter((f) => f.status === 'pending' && f._id.toString() !== followUpId)
      .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

    if (remainingPending.length > 0) {
      client.nextFollowUpDate = remainingPending[0].scheduledDate;
      client.followUpReason = remainingPending[0].reason;
      client.followUpStatus = 'scheduled';
    } else {
      client.nextFollowUpDate = null;
      client.followUpReason = '';
      client.followUpStatus = status;
    }

    await client.save();

    return sendSuccess(res, {
      message: `Follow-up call marked as ${status}.`,
      data: { client },
    });
  } catch (error) {
    next(error);
  }
};

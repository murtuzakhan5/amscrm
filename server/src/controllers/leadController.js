import { Lead, LEAD_STATUSES, LEAD_PRIORITIES } from '../models/Lead.js';
import { LeadActivity } from '../models/LeadActivity.js';
import { LeadFollowUp } from '../models/LeadFollowUp.js';
import { Client } from '../models/Client.js';
import { Task } from '../models/Task.js';
import { Meeting } from '../models/Meeting.js';
import { Employee } from '../models/Employee.js';
import { User } from '../models/User.js';
import { generateSequentialId } from '../utils/idGenerator.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { createNotification } from '../services/notificationService.js';
import { logAudit } from '../services/auditService.js';
import { getRecordFilter } from '../middleware/recordAuth.js';

export const getLeads = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      category = '',
      priority = '',
      source = '',
      assignedTo = '',
      startDate = '',
      endDate = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const baseFilter = await getRecordFilter(req.user, 'assignedTo');
    const filter = { ...baseFilter, isDeleted: false };

    if (category === 'future') {
      filter.status = 'in_future_interested';
    } else if (category === 'active') {
      filter.status = {
        $in: [
          'new_lead',
          'assigned',
          'contacted',
          'follow_up_required',
          'meeting_scheduled',
          'proposal_sent',
          'negotiation',
        ],
      };
    } else if (category === 'won') {
      filter.status = 'won';
    } else if (category === 'lost') {
      filter.status = 'lost';
    } else if (status) {
      filter.status = status;
    }
    if (priority) filter.priority = priority;
    if (source) filter.leadSource = source;
    if (assignedTo && (req.user.role === 'admin' || req.user.role === 'manager')) {
      filter.assignedTo = assignedTo;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Lead.find(filter)
        .populate('assignedTo', 'fullName email employeeId department')
        .populate('convertedClient', 'name companyName')
        .sort(sort)
        .skip(skip)
        .limit(limitNum),
      Lead.countDocuments(filter),
    ]);

    return sendSuccess(res, {
      data: leads,
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

export const getKanbanLeads = async (req, res, next) => {
  try {
    const baseFilter = await getRecordFilter(req.user, 'assignedTo');
    const filter = { ...baseFilter, isDeleted: false };

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'fullName email employeeId')
      .sort({ updatedAt: -1 });

    // Group leads by each status stage
    const kanbanData = {};
    LEAD_STATUSES.forEach((st) => {
      kanbanData[st] = [];
    });

    leads.forEach((lead) => {
      if (kanbanData[lead.status]) {
        kanbanData[lead.status].push(lead);
      }
    });

    return sendSuccess(res, {
      data: kanbanData,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeadById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const lead = await Lead.findById(id)
      .populate('assignedTo', 'fullName email employeeId phoneNumber designation')
      .populate('convertedClient', 'name companyName email')
      .populate('createdBy', 'email');

    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    // Role-based permission verification
    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      if (!lead.assignedTo || lead.assignedTo._id.toString() !== myId?.toString()) {
        return sendError(res, { statusCode: 403, message: 'Access denied to this lead.' });
      }
    }

    // Fetch full timeline and related items
    const [activities, followUps, meetings, tasks] = await Promise.all([
      LeadActivity.find({ lead: lead._id })
        .populate('performedBy', 'email employee')
        .sort({ createdAt: -1 }),
      LeadFollowUp.find({ lead: lead._id })
        .populate('assignedTo', 'fullName email')
        .sort({ scheduledDate: 1 }),
      Meeting.find({ relatedLead: lead._id })
        .populate('assignedEmployee', 'fullName email')
        .sort({ startTimeUTC: -1 }),
      Task.find({ relatedLead: lead._id })
        .populate('assignedTo', 'fullName email')
        .sort({ createdAt: -1 }),
    ]);

    return sendSuccess(res, {
      data: {
        lead,
        activities,
        followUps,
        meetings,
        tasks,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createLead = async (req, res, next) => {
  try {
    const {
      clientName,
      companyName,
      email,
      phoneNumber,
      whatsappNumber,
      leadSource = 'Website Form',
      interestedService,
      projectRequirements,
      estimatedBudget = 0,
      currency = 'USD',
      priority = 'medium',
      assignedTo = null,
      notes = '',
    } = req.body;

    if (!clientName || !email || !interestedService) {
      return sendError(res, {
        statusCode: 400,
        message: 'Client name, email, and interested service are required.',
      });
    }

    const leadId = await generateSequentialId(Lead, 'AMS-LEAD');

    const lead = new Lead({
      leadId,
      clientName,
      companyName,
      email: email.toLowerCase().trim(),
      phoneNumber,
      whatsappNumber,
      leadSource,
      interestedService,
      projectRequirements,
      estimatedBudget,
      currency,
      priority,
      status: assignedTo ? 'assigned' : 'new_lead',
      assignedTo: assignedTo || null,
      notes: notes ? [{ text: notes, author: req.user._id }] : [],
      createdBy: req.user._id,
    });

    await lead.save();

    // Log activity
    await LeadActivity.create({
      lead: lead._id,
      activityType: 'created',
      title: 'Lead Created',
      description: `Lead created from source: ${leadSource}`,
      performedBy: req.user._id,
    });

    if (assignedTo) {
      const assignedEmp = await Employee.findById(assignedTo).populate('user');
      if (assignedEmp && assignedEmp.user) {
        await createNotification({
          recipient: assignedEmp.user._id,
          title: 'New Lead Assigned',
          message: `Lead ${leadId} (${clientName}) has been assigned to you.`,
          type: 'lead_assigned',
          link: `/leads/${lead._id}`,
        });
      }

      await LeadActivity.create({
        lead: lead._id,
        activityType: 'assigned',
        title: 'Lead Assigned',
        description: `Assigned to ${assignedEmp?.fullName || 'employee'}`,
        performedBy: req.user._id,
      });
    }

    await logAudit({
      action: 'LEAD_CREATED',
      entityType: 'Lead',
      entityId: lead._id,
      performedBy: req.user._id,
      details: { leadId, clientName, email },
      req,
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'fullName email');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Lead created successfully.',
      data: { lead: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findById(id);

    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    // Permission check for employee
    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      if (!lead.assignedTo || lead.assignedTo.toString() !== myId?.toString()) {
        return sendError(res, { statusCode: 403, message: 'Access denied to update this lead.' });
      }
    }

    const {
      clientName,
      companyName,
      email,
      phoneNumber,
      whatsappNumber,
      leadSource,
      interestedService,
      projectRequirements,
      estimatedBudget,
      currency,
      priority,
    } = req.body;

    if (clientName !== undefined) lead.clientName = clientName;
    if (companyName !== undefined) lead.companyName = companyName;
    if (email !== undefined) lead.email = email.toLowerCase().trim();
    if (phoneNumber !== undefined) lead.phoneNumber = phoneNumber;
    if (whatsappNumber !== undefined) lead.whatsappNumber = whatsappNumber;
    if (leadSource !== undefined) lead.leadSource = leadSource;
    if (interestedService !== undefined) lead.interestedService = interestedService;
    if (projectRequirements !== undefined) lead.projectRequirements = projectRequirements;
    if (estimatedBudget !== undefined) lead.estimatedBudget = estimatedBudget;
    if (currency !== undefined) lead.currency = currency;
    if (priority !== undefined) lead.priority = priority;

    await lead.save();

    await logAudit({
      action: 'LEAD_UPDATED',
      entityType: 'Lead',
      entityId: lead._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'fullName email');
    return sendSuccess(res, {
      message: 'Lead updated successfully.',
      data: { lead: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const assignLead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    const newAssignee = await Employee.findById(assignedTo).populate('user');
    if (!newAssignee) {
      return sendError(res, { statusCode: 404, message: 'Target employee not found.' });
    }

    const oldAssigneeId = lead.assignedTo;
    lead.assignedTo = newAssignee._id;
    if (lead.status === 'new_lead') {
      lead.status = 'assigned';
    }
    await lead.save();

    // In-app notification to new assignee
    if (newAssignee.user) {
      await createNotification({
        recipient: newAssignee.user._id,
        title: 'Lead Assigned to You',
        message: `Lead ${lead.leadId} (${lead.clientName}) has been assigned to you.`,
        type: 'lead_assigned',
        link: `/leads/${lead._id}`,
      });
    }

    // Lead activity
    await LeadActivity.create({
      lead: lead._id,
      activityType: oldAssigneeId ? 'reassigned' : 'assigned',
      title: oldAssigneeId ? 'Lead Reassigned' : 'Lead Assigned',
      description: `Assigned to ${newAssignee.fullName} (${newAssignee.department})`,
      performedBy: req.user._id,
    });

    await logAudit({
      action: oldAssigneeId ? 'LEAD_REASSIGNED' : 'LEAD_ASSIGNED',
      entityType: 'Lead',
      entityId: lead._id,
      performedBy: req.user._id,
      details: { leadId: lead.leadId, assignedTo: newAssignee.fullName },
      req,
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'fullName email employeeId');
    return sendSuccess(res, {
      message: `Lead assigned to ${newAssignee.fullName}.`,
      data: { lead: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const bulkAssignLeads = async (req, res, next) => {
  try {
    const { leadIds, assignedTo } = req.body;

    if (!Array.isArray(leadIds) || leadIds.length === 0 || !assignedTo) {
      return sendError(res, { statusCode: 400, message: 'Please provide leadIds array and assignedTo employee ID.' });
    }

    const employee = await Employee.findById(assignedTo).populate('user');
    if (!employee) {
      return sendError(res, { statusCode: 404, message: 'Employee not found.' });
    }

    await Lead.updateMany(
      { _id: { $in: leadIds } },
      {
        $set: {
          assignedTo: employee._id,
          status: 'assigned',
        },
      }
    );

    // Create notifications and activities
    if (employee.user) {
      await createNotification({
        recipient: employee.user._id,
        title: 'Bulk Leads Assigned',
        message: `${leadIds.length} leads have been assigned to you.`,
        type: 'lead_assigned',
        link: '/leads',
      });
    }

    return sendSuccess(res, {
      message: `Successfully assigned ${leadIds.length} leads to ${employee.fullName}.`,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      status,
      lostReason = '',
      futureReason = '',
      futureFollowUpDate = null,
      notes = '',
    } = req.body;

    if (!LEAD_STATUSES.includes(status)) {
      return sendError(res, { statusCode: 400, message: 'Invalid lead status.' });
    }

    if (status === 'lost' && !lostReason) {
      return sendError(res, { statusCode: 400, message: 'A reason must be provided when marking a lead as Lost.' });
    }

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    // Role check
    if (req.user.role === 'employee') {
      const myId = req.user.employee?._id || req.user.employee;
      if (!lead.assignedTo || lead.assignedTo.toString() !== myId?.toString()) {
        return sendError(res, { statusCode: 403, message: 'Access denied to modify this lead.' });
      }
    }

    const oldStatus = lead.status;
    lead.status = status;
    if (status === 'lost') lead.lostReason = lostReason;
    if (status === 'won') lead.lostReason = '';

    if (status === 'in_future_interested') {
      lead.futureReason = futureReason;
      if (futureFollowUpDate) {
        lead.futureFollowUpDate = new Date(futureFollowUpDate);
        lead.nextFollowUpDate = new Date(futureFollowUpDate);

        // Automatically create a follow up reminder entry
        const assignedEmp = lead.assignedTo || req.user.employee?._id || req.user.employee;
        if (assignedEmp) {
          await LeadFollowUp.create({
            lead: lead._id,
            title: `Future Prospect Follow-up (${lead.clientName})`,
            scheduledDate: new Date(futureFollowUpDate),
            assignedTo: assignedEmp,
            notes: futureReason || 'Client requested future follow-up. Keep in touch.',
            createdBy: req.user._id,
          });
        }
      }
    }

    if (notes) {
      lead.notes.push({ text: notes, author: req.user._id });
    }

    await lead.save();

    // Log Activity
    let activityType = 'status_change';
    let activityDesc = notes || `Changed from ${oldStatus} to ${status}`;

    if (status === 'won') {
      activityType = 'marked_won';
    } else if (status === 'lost') {
      activityType = 'marked_lost';
      activityDesc = `Reason: ${lostReason}`;
    } else if (status === 'in_future_interested') {
      activityType = 'marked_in_future';
      activityDesc = `Interested (Future Prospect). Reason: ${futureReason || 'Client requested recontact later'}${
        futureFollowUpDate ? `. Re-contact Date: ${new Date(futureFollowUpDate).toLocaleDateString()}` : ''
      }`;
    }

    await LeadActivity.create({
      lead: lead._id,
      activityType,
      title: `Status: ${status.replace(/_/g, ' ').toUpperCase()}`,
      description: activityDesc,
      performedBy: req.user._id,
    });

    await logAudit({
      action: 'LEAD_STATUS_CHANGED',
      entityType: 'Lead',
      entityId: lead._id,
      performedBy: req.user._id,
      details: { oldStatus, newStatus: status, lostReason, futureReason, futureFollowUpDate },
      req,
    });

    const populated = await Lead.findById(lead._id).populate('assignedTo', 'fullName email');
    return sendSuccess(res, {
      message: `Lead status updated to ${status.replace(/_/g, ' ')}.`,
      data: { lead: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const addLeadNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return sendError(res, { statusCode: 400, message: 'Note text cannot be empty.' });
    }

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    lead.notes.push({ text, author: req.user._id, createdAt: new Date() });
    await lead.save();

    await LeadActivity.create({
      lead: lead._id,
      activityType: 'note_added',
      title: 'Note Added',
      description: text,
      performedBy: req.user._id,
    });

    return sendSuccess(res, {
      message: 'Note added successfully.',
      data: { notes: lead.notes },
    });
  } catch (error) {
    next(error);
  }
};

export const logLeadCall = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationMinutes = 5, outcome, notes, nextFollowUpDate } = req.body;

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    lead.lastContactDate = new Date();
    if (lead.status === 'new_lead' || lead.status === 'assigned') {
      lead.status = 'contacted';
    }
    if (nextFollowUpDate) {
      lead.nextFollowUpDate = new Date(nextFollowUpDate);
    }
    await lead.save();

    await LeadActivity.create({
      lead: lead._id,
      activityType: 'call_logged',
      title: `Call Logged: ${outcome || 'Contacted Client'}`,
      description: `Duration: ${durationMinutes} mins. Notes: ${notes || 'No notes.'}`,
      metadata: { durationMinutes, outcome },
      performedBy: req.user._id,
    });

    return sendSuccess(res, {
      message: 'Call logged successfully.',
      data: { lead },
    });
  } catch (error) {
    next(error);
  }
};

export const addLeadFollowUp = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, scheduledDate, notes } = req.body;

    if (!title || !scheduledDate) {
      return sendError(res, { statusCode: 400, message: 'Follow-up title and scheduled date are required.' });
    }

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    const assignedEmployeeId = lead.assignedTo || req.user.employee?._id || req.user.employee;
    if (!assignedEmployeeId) {
      return sendError(res, { statusCode: 400, message: 'Lead must be assigned to an employee before scheduling a follow-up.' });
    }

    const followUp = await LeadFollowUp.create({
      lead: lead._id,
      title,
      scheduledDate: new Date(scheduledDate),
      assignedTo: assignedEmployeeId,
      notes: notes || '',
      createdBy: req.user._id,
    });

    lead.nextFollowUpDate = new Date(scheduledDate);
    if (lead.status === 'contacted') {
      lead.status = 'follow_up_required';
    }
    await lead.save();

    await LeadActivity.create({
      lead: lead._id,
      activityType: 'follow_up_scheduled',
      title: 'Follow-up Scheduled',
      description: `${title} on ${new Date(scheduledDate).toLocaleString()}`,
      performedBy: req.user._id,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Follow-up scheduled successfully.',
      data: { followUp },
    });
  } catch (error) {
    next(error);
  }
};

export const convertLeadToClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clientName, companyName, email, phoneNumber, services, address, notes } = req.body;

    const lead = await Lead.findById(id);
    if (!lead || lead.isDeleted) {
      return sendError(res, { statusCode: 404, message: 'Lead not found.' });
    }

    // Check if lead already converted
    if (lead.convertedClient) {
      return sendError(res, { statusCode: 400, message: 'This lead has already been converted into a client.' });
    }

    // Create Client record
    const client = await Client.create({
      name: clientName || lead.clientName,
      companyName: companyName || lead.companyName,
      email: email || lead.email,
      phoneNumber: phoneNumber || lead.phoneNumber,
      services: services || (lead.interestedService ? [lead.interestedService] : []),
      address: address || {},
      notes: notes || lead.projectRequirements || '',
      accountManager: lead.assignedTo || null,
      convertedFromLead: lead._id,
      createdBy: req.user._id,
    });

    lead.convertedClient = client._id;
    lead.status = 'won';
    await lead.save();

    await LeadActivity.create({
      lead: lead._id,
      activityType: 'converted_to_client',
      title: 'Lead Converted to Client',
      description: `Client record created for "${client.name} (${client.companyName})"`,
      performedBy: req.user._id,
    });

    await logAudit({
      action: 'LEAD_CONVERTED',
      entityType: 'Lead',
      entityId: lead._id,
      performedBy: req.user._id,
      details: { leadId: lead.leadId, clientId: client._id, clientName: client.name },
      req,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Lead converted into client successfully!',
      data: { client, lead },
    });
  } catch (error) {
    next(error);
  }
};

export const exportLeadsToCsv = async (req, res, next) => {
  try {
    const baseFilter = await getRecordFilter(req.user, 'assignedTo');
    const filter = { ...baseFilter, isDeleted: false };

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'fullName email employeeId')
      .sort({ createdAt: -1 });

    const headers = [
      'Lead ID',
      'Client Name',
      'Company Name',
      'Email',
      'Phone',
      'Source',
      'Service',
      'Status',
      'Priority',
      'Budget',
      'Currency',
      'Assigned Employee',
      'Created Date',
    ];

    const rows = leads.map((l) => [
      `"${l.leadId || ''}"`,
      `"${(l.clientName || '').replace(/"/g, '""')}"`,
      `"${(l.companyName || '').replace(/"/g, '""')}"`,
      `"${l.email || ''}"`,
      `"${l.phoneNumber || ''}"`,
      `"${l.leadSource || ''}"`,
      `"${(l.interestedService || '').replace(/"/g, '""')}"`,
      `"${l.status || ''}"`,
      `"${l.priority || ''}"`,
      `"${l.estimatedBudget || 0}"`,
      `"${l.currency || 'USD'}"`,
      `"${l.assignedTo?.fullName || 'Unassigned'}"`,
      `"${new Date(l.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="ams_crafters_leads.csv"');
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

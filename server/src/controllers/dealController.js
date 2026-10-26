import { Deal, DEAL_STAGES } from '../models/Deal.js';
import { Employee } from '../models/Employee.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import { logAudit } from '../services/auditService.js';
import { getRecordFilter } from '../middleware/recordAuth.js';

export const getDeals = async (req, res, next) => {
  try {
    const { stage = '', status = '', owner = '', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const baseFilter = await getRecordFilter(req.user, 'owner');
    const filter = { ...baseFilter };

    if (stage) filter.stage = stage;
    if (status) filter.status = status;
    if (owner && (req.user.role === 'admin' || req.user.role === 'manager')) {
      filter.owner = owner;
    }

    const deals = await Deal.find(filter)
      .populate('owner', 'fullName email designation department')
      .populate('closedBy', 'fullName email designation department')
      .populate('lead', 'clientName companyName leadId')
      .populate('client', 'name companyName')
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    // Aggregate summary metrics
    let totalDealValue = 0;
    let totalActualRevenue = 0;
    let wonDealValue = 0;

    deals.forEach((deal) => {
      totalDealValue += deal.value || 0;
      totalActualRevenue += deal.actualRevenueReceived || 0;
      if (deal.status === 'won') wonDealValue += deal.value || 0;
    });

    return sendSuccess(res, {
      data: deals,
      meta: {
        totalDeals: deals.length,
        totalDealValue,
        totalActualRevenue,
        wonDealValue,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getPipelineStages = async (req, res, next) => {
  try {
    const baseFilter = await getRecordFilter(req.user, 'owner');
    const filter = { ...baseFilter };

    const deals = await Deal.find(filter)
      .populate('owner', 'fullName email')
      .populate('client', 'name companyName');

    const stages = {};
    DEAL_STAGES.forEach((st) => {
      stages[st] = {
        stage: st,
        count: 0,
        totalValue: 0,
        deals: [],
      };
    });

    deals.forEach((deal) => {
      if (stages[deal.stage]) {
        stages[deal.stage].count += 1;
        stages[deal.stage].totalValue += deal.value || 0;
        stages[deal.stage].deals.push(deal);
      }
    });

    return sendSuccess(res, {
      data: Object.values(stages),
    });
  } catch (error) {
    next(error);
  }
};

export const createDeal = async (req, res, next) => {
  try {
    const {
      title,
      lead = null,
      client = null,
      value,
      currency = 'USD',
      owner,
      closedBy,
      isDirectClosed = false,
      stage = 'qualification',
      expectedCloseDate,
      probability = 50,
      notes = '',
    } = req.body;

    if (!title || value === undefined || !expectedCloseDate) {
      return sendError(res, { statusCode: 400, message: 'Deal title, value, and expected close date are required.' });
    }

    const dealOwner = owner || req.user.employee?._id || req.user.employee;
    if (!dealOwner) {
      return sendError(res, { statusCode: 400, message: 'Deal owner is required.' });
    }

    const isWon = stage === 'won' || Boolean(isDirectClosed);
    const resolvedClosedBy = closedBy || (isWon ? dealOwner : null);

    const deal = await Deal.create({
      title,
      lead,
      client,
      value: Number(value),
      currency,
      owner: dealOwner,
      closedBy: resolvedClosedBy,
      isDirectClosed: Boolean(isDirectClosed),
      closedAt: isWon ? new Date() : null,
      stage,
      expectedCloseDate: new Date(expectedCloseDate),
      probability: isWon ? 100 : Number(probability),
      status: stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open',
      notes,
      createdBy: req.user._id,
    });

    await logAudit({
      action: 'DEAL_CREATED',
      entityType: 'Deal',
      entityId: deal._id,
      performedBy: req.user._id,
      details: { title, value, owner: dealOwner, closedBy: resolvedClosedBy },
      req,
    });

    const populated = await Deal.findById(deal._id)
      .populate('owner', 'fullName email designation department')
      .populate('closedBy', 'fullName email designation department');

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Deal created successfully.',
      data: { deal: populated },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deal = await Deal.findById(id);

    if (!deal) {
      return sendError(res, { statusCode: 404, message: 'Deal not found.' });
    }

    const {
      title,
      value,
      currency,
      owner,
      closedBy,
      isDirectClosed,
      stage,
      expectedCloseDate,
      probability,
      status,
      paymentStatus,
      actualRevenueReceived,
      lostReason,
      notes,
    } = req.body;

    if (title !== undefined) deal.title = title;
    if (value !== undefined) deal.value = Number(value);
    if (currency !== undefined) deal.currency = currency;
    if (owner !== undefined) deal.owner = owner;
    if (closedBy !== undefined) deal.closedBy = closedBy || null;
    if (isDirectClosed !== undefined) deal.isDirectClosed = Boolean(isDirectClosed);
    if (expectedCloseDate !== undefined) deal.expectedCloseDate = new Date(expectedCloseDate);
    if (probability !== undefined) deal.probability = Number(probability);
    if (paymentStatus !== undefined) deal.paymentStatus = paymentStatus;
    if (actualRevenueReceived !== undefined) deal.actualRevenueReceived = Number(actualRevenueReceived);
    if (lostReason !== undefined) deal.lostReason = lostReason;
    if (notes !== undefined) deal.notes = notes;

    if (stage !== undefined) {
      deal.stage = stage;
      if (stage === 'won') {
        deal.status = 'won';
        if (!deal.closedBy) deal.closedBy = closedBy || deal.owner;
        if (!deal.closedAt) deal.closedAt = new Date();
      } else if (stage === 'lost') {
        deal.status = 'lost';
      } else {
        deal.status = 'open';
      }
    }

    if (status !== undefined) deal.status = status;

    await deal.save();

    await logAudit({
      action: 'DEAL_UPDATED',
      entityType: 'Deal',
      entityId: deal._id,
      performedBy: req.user._id,
      details: { updatedFields: req.body },
      req,
    });

    const populated = await Deal.findById(deal._id)
      .populate('owner', 'fullName email designation department')
      .populate('closedBy', 'fullName email designation department');

    return sendSuccess(res, {
      message: 'Deal updated successfully.',
      data: { deal: populated },
    });
  } catch (error) {
    next(error);
  }
};

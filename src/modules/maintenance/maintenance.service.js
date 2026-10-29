import crypto from 'node:crypto';
import { MaintenanceTicket } from './maintenance.model.js';
import { Bungalow } from '../bungalows/bungalow.model.js';
import { NotFoundError } from '../../common/errors/app.error.js';
import { MAINTENANCE_STATUS, BUNGALOW_MAINTENANCE_STATUS } from '../../config/constants.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

const generateTicketNumber = () => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `MNT-${dateStr}-${randomHex}`;
};

/**
 * Re-evaluates and synchronizes the bungalow's maintenance status
 * based on all remaining active tickets for that bungalow.
 */
const syncBungalowMaintenanceStatus = async bungalowId => {
  const activeTickets = await MaintenanceTicket.find({
    bungalow: bungalowId,
    status: {
      $in: [
        MAINTENANCE_STATUS.REPORTED,
        MAINTENANCE_STATUS.APPROVED,
        MAINTENANCE_STATUS.ASSIGNED,
        MAINTENANCE_STATUS.IN_PROGRESS,
      ],
    },
  });

  let newStatus = BUNGALOW_MAINTENANCE_STATUS.NONE;

  if (activeTickets.some(t => t.blocksAvailability)) {
    newStatus = BUNGALOW_MAINTENANCE_STATUS.UNDER_MAINTENANCE;
  } else if (activeTickets.length > 0) {
    newStatus = BUNGALOW_MAINTENANCE_STATUS.PARTIAL;
  }

  await Bungalow.findByIdAndUpdate(bungalowId, { maintenanceStatus: newStatus });
  return newStatus;
};

export const createTicket = async (data, req) => {
  const bungalow = await Bungalow.findById(data.bungalow);
  if (!bungalow) {
    throw new NotFoundError(`Bungalow with id ${data.bungalow} not found`);
  }

  const ticketNumber = generateTicketNumber();

  const ticket = await MaintenanceTicket.create({
    ticketNumber,
    branch: bungalow.branch,
    bungalow: bungalow._id,
    facilityAffected: data.facilityAffected,
    problemDescription: data.problemDescription,
    priority: data.priority,
    blocksAvailability: data.blocksAvailability,
    status: MAINTENANCE_STATUS.REPORTED,
    requestedBy: req.user._id,
    statusHistory: [
      {
        status: MAINTENANCE_STATUS.REPORTED,
        changedBy: req.user._id,
        remarks: 'Ticket opened',
        changedAt: new Date(),
      },
    ],
  });

  // Synchronize bungalow status
  await syncBungalowMaintenanceStatus(bungalow._id);

  const populated = await MaintenanceTicket.findById(ticket._id)
    .populate('bungalow', 'number category')
    .populate('branch', 'name code')
    .populate('requestedBy', 'name email');

  await logAudit({
    req,
    action: 'MAINTENANCE_REPORTED',
    entity: 'MAINTENANCE',
    entityId: ticket._id,
    branch: bungalow.branch,
    changes: {
      ticketNumber,
      bungalow: bungalow.number,
      facility: data.facilityAffected,
      priority: data.priority,
      blocksAvailability: data.blocksAvailability,
    },
  });

  return populated;
};

export const updateTicketStatus = async (id, data, req) => {
  const ticket = await MaintenanceTicket.findById(id);
  if (!ticket) {
    throw new NotFoundError(`Maintenance ticket with id ${id} not found`);
  }

  const previousStatus = ticket.status;
  ticket.status = data.status;

  if (data.assignedTo) {
    ticket.assignedTo = data.assignedTo;
  }

  if (data.blocksAvailability !== undefined) {
    ticket.blocksAvailability = data.blocksAvailability;
  }

  if (data.status === MAINTENANCE_STATUS.APPROVED) {
    ticket.approvedBy = req.user._id;
  }

  if (data.status === MAINTENANCE_STATUS.COMPLETED || data.status === MAINTENANCE_STATUS.REJECTED) {
    ticket.resolvedAt = new Date();
  }

  ticket.statusHistory.push({
    status: data.status,
    changedBy: req.user._id,
    remarks: data.remarks || '',
    changedAt: new Date(),
  });

  await ticket.save();

  // Re-synchronize bungalow maintenance status
  await syncBungalowMaintenanceStatus(ticket.bungalow);

  const updatedTicket = await MaintenanceTicket.findById(id)
    .populate('bungalow', 'number category')
    .populate('branch', 'name code')
    .populate('requestedBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('approvedBy', 'name email')
    .populate('statusHistory.changedBy', 'name');

  await logAudit({
    req,
    action: 'MAINTENANCE_STATUS_UPDATED',
    entity: 'MAINTENANCE',
    entityId: ticket._id,
    branch: ticket.branch,
    changes: {
      ticketNumber: ticket.ticketNumber,
      from: previousStatus,
      to: data.status,
      remarks: data.remarks,
    },
  });

  return updatedTicket;
};

export const getAllTickets = async ({
  branchId,
  bungalowId,
  status,
  priority,
  page = 1,
  limit = 20,
}) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (bungalowId) filter.bungalow = bungalowId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const skip = (page - 1) * limit;

  const [tickets, total] = await Promise.all([
    MaintenanceTicket.find(filter)
      .populate('bungalow', 'number category')
      .populate('branch', 'name code')
      .populate('requestedBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MaintenanceTicket.countDocuments(filter),
  ]);

  return {
    tickets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getTicketById = async id => {
  const ticket = await MaintenanceTicket.findById(id)
    .populate('bungalow', 'number category facilities')
    .populate('branch', 'name code')
    .populate('requestedBy', 'name email')
    .populate('assignedTo', 'name email')
    .populate('approvedBy', 'name email')
    .populate('statusHistory.changedBy', 'name email');

  if (!ticket) {
    throw new NotFoundError(`Maintenance ticket with id ${id} not found`);
  }
  return ticket;
};

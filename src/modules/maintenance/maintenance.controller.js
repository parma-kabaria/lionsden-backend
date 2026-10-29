import * as maintenanceService from './maintenance.service.js';
import { sendSuccess, sendCreated } from '../../common/utils/response.util.js';

export const createTicket = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.createTicket(req.body, req);
    return sendCreated(res, { data: ticket, message: 'Maintenance request reported successfully' });
  } catch (error) {
    next(error);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.updateTicketStatus(req.params.id, req.body, req);
    return sendSuccess(res, {
      data: ticket,
      message: 'Maintenance ticket status updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTickets = async (req, res, next) => {
  try {
    const { branchId, bungalowId, status, priority, page, limit } = req.query;
    const effectiveBranch = req.effectiveBranchId || branchId;

    const result = await maintenanceService.getAllTickets({
      branchId: effectiveBranch,
      bungalowId,
      status,
      priority,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    return sendSuccess(res, {
      data: result.tickets,
      meta: { pagination: result.pagination },
      message: 'Maintenance tickets retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const ticket = await maintenanceService.getTicketById(req.params.id);
    return sendSuccess(res, { data: ticket, message: 'Maintenance ticket retrieved successfully' });
  } catch (error) {
    next(error);
  }
};

import { Role } from './role.model.js';
import { NotFoundError, ConflictError, BadRequestError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';
import { PERMISSIONS } from '../../config/constants.js';

export const getAvailablePermissions = async () => {
  const categories = [
    {
      category: 'Users & Roles',
      icon: 'solar:user-bold',
      permissions: [
        { code: PERMISSIONS.USERS_READ, label: 'View Staff & Users', description: 'Can view list of staff members and user profiles' },
        { code: PERMISSIONS.USERS_CREATE, label: 'Create Staff', description: 'Can create new staff logins' },
        { code: PERMISSIONS.USERS_UPDATE, label: 'Edit Staff', description: 'Can update user profiles and status' },
        { code: PERMISSIONS.USERS_DELETE, label: 'Deactivate Staff', description: 'Can deactivate or remove staff accounts' },
        { code: PERMISSIONS.ROLES_MANAGE, label: 'Manage Roles & Permissions', description: 'Full access to create and modify roles and permissions' },
      ],
    },
    {
      category: 'Branches & Locations',
      icon: 'solar:map-point-wave-bold',
      permissions: [
        { code: PERMISSIONS.BRANCHES_READ, label: 'View Branches', description: 'View Dhari Resort and Ahmedabad HQ details' },
        { code: PERMISSIONS.BRANCHES_CREATE, label: 'Create Branch', description: 'Add new corporate desk or location' },
        { code: PERMISSIONS.BRANCHES_UPDATE, label: 'Update Branch', description: 'Edit branch details and settings' },
        { code: PERMISSIONS.BRANCHES_DELETE, label: 'Delete Branch', description: 'Remove branch' },
      ],
    },
    {
      category: 'Bungalows & Inventory',
      icon: 'solar:home-smile-angle-bold',
      permissions: [
        { code: PERMISSIONS.BUNGALOWS_READ, label: 'View Bungalows', description: 'View 1BHK - 4BHK bungalow catalog and details at Dhari' },
        { code: PERMISSIONS.BUNGALOWS_CREATE, label: 'Add Bungalow', description: 'Register new bungalow unit in resort' },
        { code: PERMISSIONS.BUNGALOWS_UPDATE, label: 'Update Bungalow', description: 'Edit bungalow amenities, base rent, and status' },
        { code: PERMISSIONS.BUNGALOWS_DELETE, label: 'Remove Bungalow', description: 'Decommission bungalow unit' },
      ],
    },
    {
      category: 'Pricing & Festivals',
      icon: 'solar:tag-price-bold',
      permissions: [
        { code: PERMISSIONS.PRICING_READ, label: 'View Pricing Rules', description: 'View seasonal, festival, and weekend pricing' },
        { code: PERMISSIONS.PRICING_CREATE, label: 'Create Pricing Rule', description: 'Add surge pricing or special festival rates' },
        { code: PERMISSIONS.PRICING_UPDATE, label: 'Update Pricing Rule', description: 'Modify active pricing rules and overrides' },
        { code: PERMISSIONS.PRICING_DELETE, label: 'Delete Pricing Rule', description: 'Remove pricing rule' },
      ],
    },
    {
      category: 'Bookings & Reservations',
      icon: 'solar:calendar-date-bold',
      permissions: [
        { code: PERMISSIONS.AVAILABILITY_SEARCH, label: 'Check Availability', description: 'Search live bungalow availability across dates' },
        { code: PERMISSIONS.BOOKINGS_READ, label: 'View Bookings', description: 'View guest bookings, check-in, and check-out status' },
        { code: PERMISSIONS.BOOKINGS_CREATE, label: 'Create Booking', description: 'Book bungalows from Ahmedabad HQ or Dhari desk' },
        { code: PERMISSIONS.BOOKINGS_UPDATE, label: 'Update Booking', description: 'Modify booking dates, food options, or guest details' },
        { code: PERMISSIONS.BOOKINGS_CANCEL, label: 'Cancel Booking', description: 'Process guest booking cancellations' },
      ],
    },
    {
      category: 'Customers & Guests',
      icon: 'solar:users-group-two-rounded-bold',
      permissions: [
        { code: PERMISSIONS.CUSTOMERS_READ, label: 'View Customers', description: 'Browse customer directory and stay history' },
        { code: PERMISSIONS.CUSTOMERS_CREATE, label: 'Register Customer', description: 'Add customer contact and ID verification' },
        { code: PERMISSIONS.CUSTOMERS_UPDATE, label: 'Update Customer', description: 'Edit customer profile and notes' },
      ],
    },
    {
      category: 'Rate Negotiation & Approvals',
      icon: 'solar:hand-money-bold',
      permissions: [
        { code: PERMISSIONS.NEGOTIATIONS_READ, label: 'View Negotiation Requests', description: 'View requested discounts from sales team' },
        { code: PERMISSIONS.NEGOTIATIONS_SUBMIT, label: 'Submit Discount Request', description: 'Request special price concession for guest' },
        { code: PERMISSIONS.NEGOTIATIONS_APPROVE, label: 'Approve/Reject Negotiation', description: 'Authority to approve price discounts' },
      ],
    },
    {
      category: 'Payments & Collections',
      icon: 'solar:card-bold',
      permissions: [
        { code: PERMISSIONS.PAYMENTS_READ, label: 'View Payments', description: 'View receipts, UPI, and cash payment logs' },
        { code: PERMISSIONS.PAYMENTS_RECORD, label: 'Record Payment', description: 'Accept advance deposit or checkout balance' },
        { code: PERMISSIONS.PAYMENTS_REVERSE, label: 'Reverse Payment', description: 'Process payment reversal or refund' },
      ],
    },
    {
      category: 'Maintenance & Repairs',
      icon: 'solar:wrench-bold',
      permissions: [
        { code: PERMISSIONS.MAINTENANCE_READ, label: 'View Maintenance', description: 'View maintenance tickets and bungalow health' },
        { code: PERMISSIONS.MAINTENANCE_CREATE, label: 'Report Issue', description: 'Log bungalow repair or AC/plumbing service' },
        { code: PERMISSIONS.MAINTENANCE_UPDATE, label: 'Update Ticket', description: 'Update progress and completion details' },
        { code: PERMISSIONS.MAINTENANCE_APPROVE, label: 'Approve Maintenance', description: 'Approve maintenance completion and return unit to inventory' },
      ],
    },
    {
      category: 'Reports & Dashboard',
      icon: 'solar:chart-2-bold',
      permissions: [
        { code: PERMISSIONS.DASHBOARD_READ, label: 'View Dashboard', description: 'Access KPI analytics, revenue, and occupancy dashboard' },
        { code: PERMISSIONS.REPORTS_READ, label: 'Access Reports', description: 'Generate revenue, collection, and occupancy reports' },
        { code: PERMISSIONS.AUDIT_LOGS_READ, label: 'View Audit Logs', description: 'Inspect system audit trail and user actions' },
      ],
    },
  ];

  return {
    allPermissions: Object.values(PERMISSIONS),
    categories,
  };
};

export const getAllRoles = async () => {
  return Role.find().sort({ createdAt: 1 });
};

export const getRoleById = async id => {
  const role = await Role.findById(id);
  if (!role) {
    throw new NotFoundError(`Role with id ${id} not found`);
  }
  return role;
};

export const createRole = async (data, req) => {
  const existing = await Role.findOne({ code: data.code });
  if (existing) {
    throw new ConflictError(`Role with code ${data.code} already exists`);
  }

  const role = await Role.create(data);

  await logAudit({
    req,
    action: 'ROLE_CREATED',
    entity: 'ROLE',
    entityId: role._id,
    changes: data,
  });

  return role;
};

export const updateRole = async (id, data, req) => {
  const role = await Role.findById(id);
  if (!role) {
    throw new NotFoundError(`Role with id ${id} not found`);
  }

  if (role.isSystem && data.permissions && role.code === 'SUPER_ADMIN') {
    throw new BadRequestError('Super Admin permissions cannot be modified');
  }

  const previousData = role.toObject();
  Object.assign(role, data);
  await role.save();

  await logAudit({
    req,
    action: 'ROLE_UPDATED',
    entity: 'ROLE',
    entityId: role._id,
    changes: { before: previousData, after: data },
  });

  return role;
};

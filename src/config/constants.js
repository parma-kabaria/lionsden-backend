/**
 * System-wide Constants and Enums
 * LionsDen Resort Management System
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  SALES: 'SALES',
};

export const PERMISSIONS = {
  // Users & Roles
  USERS_MANAGE: 'users:manage',
  USERS_CREATE: 'users:create',
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_DELETE: 'users:delete',
  ROLES_MANAGE: 'roles:manage',

  // Branches
  BRANCHES_MANAGE: 'branches:manage',
  BRANCHES_CREATE: 'branches:create',
  BRANCHES_READ: 'branches:read',
  BRANCHES_UPDATE: 'branches:update',
  BRANCHES_DELETE: 'branches:delete',

  // Bungalows
  BUNGALOWS_MANAGE: 'bungalows:manage',
  BUNGALOWS_CREATE: 'bungalows:create',
  BUNGALOWS_READ: 'bungalows:read',
  BUNGALOWS_UPDATE: 'bungalows:update',
  BUNGALOWS_DELETE: 'bungalows:delete',

  // Pricing
  PRICING_MANAGE: 'pricing:manage',
  PRICING_CREATE: 'pricing:create',
  PRICING_READ: 'pricing:read',
  PRICING_UPDATE: 'pricing:update',
  PRICING_DELETE: 'pricing:delete',

  // Bookings & Availability
  BOOKINGS_MANAGE: 'bookings:manage',
  AVAILABILITY_SEARCH: 'availability:search',
  BOOKINGS_CREATE: 'bookings:create',
  BOOKINGS_READ: 'bookings:read',
  BOOKINGS_UPDATE: 'bookings:update',
  BOOKINGS_CANCEL: 'bookings:cancel',

  // Customers
  CUSTOMERS_MANAGE: 'customers:manage',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_READ: 'customers:read',
  CUSTOMERS_UPDATE: 'customers:update',

  // Negotiations
  NEGOTIATIONS_MANAGE: 'negotiations:manage',
  NEGOTIATIONS_SUBMIT: 'negotiations:submit',
  NEGOTIATIONS_READ: 'negotiations:read',
  NEGOTIATIONS_APPROVE: 'negotiations:approve',

  // Payments
  PAYMENTS_MANAGE: 'payments:manage',
  PAYMENTS_RECORD: 'payments:record',
  PAYMENTS_READ: 'payments:read',
  PAYMENTS_REVERSE: 'payments:reverse',

  // Maintenance
  MAINTENANCE_MANAGE: 'maintenance:manage',
  MAINTENANCE_CREATE: 'maintenance:create',
  MAINTENANCE_READ: 'maintenance:read',
  MAINTENANCE_UPDATE: 'maintenance:update',
  MAINTENANCE_APPROVE: 'maintenance:approve',

  // Reports & Dashboard
  DASHBOARD_READ: 'dashboard:read',
  REPORTS_READ: 'reports:read',
  AUDIT_LOGS_READ: 'audit_logs:read',
};

export const BUNGALOW_CATEGORIES = {
  ONE_BHK: '1BHK',
  TWO_BHK: '2BHK',
  THREE_BHK: '3BHK',
  FOUR_BHK: '4BHK',
};

export const STANDARD_FACILITIES = [
  'Air Conditioning',
  'Geyser',
  'Smart TV',
  'High-Speed Wi-Fi',
  'Private Lawn',
  'Plunge Pool',
  'Refrigerator',
  'Electric Kettle',
  'Balcony View',
  'Power Backup',
];

export const BOOKING_STATUS = {
  CONFIRMED: 'CONFIRMED',
  CHECKED_IN: 'CHECKED_IN',
  CHECKED_OUT: 'CHECKED_OUT',
  CANCELLED: 'CANCELLED',
};

export const FOOD_OPTIONS = {
  WITH_FOOD: 'WITH_FOOD',
  WITHOUT_FOOD: 'WITHOUT_FOOD',
};

export const NEGOTIATION_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
};

export const PAYMENT_MODES = {
  UPI: 'UPI',
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
};

export const PAYMENT_TYPES = {
  ADVANCE: 'ADVANCE',
  BALANCE: 'BALANCE',
  REVERSAL: 'REVERSAL',
};

export const MAINTENANCE_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const MAINTENANCE_STATUS = {
  REPORTED: 'REPORTED',
  APPROVED: 'APPROVED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

export const BUNGALOW_MAINTENANCE_STATUS = {
  NONE: 'NONE',
  PARTIAL: 'PARTIAL',
  UNDER_MAINTENANCE: 'UNDER_MAINTENANCE',
};

export const PRICING_ADJUSTMENT_TYPES = {
  FIXED_RENT: 'FIXED_RENT',
  PERCENTAGE_SURGE: 'PERCENTAGE_SURGE',
  PERCENTAGE_DISCOUNT: 'PERCENTAGE_DISCOUNT',
};

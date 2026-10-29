import { Customer } from './customer.model.js';
import { NotFoundError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const findOrCreateCustomer = async (data, req, session = null) => {
  const query = Customer.findOne({ phone: data.phone });
  if (session) query.session(session);
  let customer = await query;

  if (customer) {
    let modified = false;
    if (data.name && customer.name !== data.name) {
      customer.name = data.name;
      modified = true;
    }
    if (data.email && !customer.email) {
      customer.email = data.email;
      modified = true;
    }
    if (modified) {
      await customer.save({ session: session || null });
    }
    return customer;
  }

  if (session) {
    const [created] = await Customer.create([data], { session });
    customer = created;
  } else {
    customer = await Customer.create(data);
  }

  await logAudit({
    req,
    action: 'CUSTOMER_CREATED',
    entity: 'CUSTOMER',
    entityId: customer._id,
    branch: customer.branch,
    changes: { name: customer.name, phone: customer.phone },
  });

  return customer;
};

export const incrementCustomerBookings = async (customerId, session = null) => {
  if (!customerId) return;
  await Customer.updateOne(
    { _id: customerId },
    { $inc: { totalBookings: 1 } },
    { session: session || null }
  );
};

export const createCustomer = async (data, req, session = null) => {
  return findOrCreateCustomer(data, req, session);
};

export const getAllCustomers = async ({ branchId, search, page = 1, limit = 20 }) => {
  const filter = {};

  if (branchId) filter.branch = branchId;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find(filter)
      .populate('branch', 'name code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Customer.countDocuments(filter),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getCustomerById = async id => {
  const customer = await Customer.findById(id).populate('branch', 'name code');
  if (!customer) {
    throw new NotFoundError(`Customer with id ${id} not found`);
  }
  return customer;
};

export const updateCustomer = async (id, data, req) => {
  const customer = await Customer.findById(id);
  if (!customer) {
    throw new NotFoundError(`Customer with id ${id} not found`);
  }

  const previousData = customer.toObject();
  Object.assign(customer, data);
  await customer.save();

  await logAudit({
    req,
    action: 'CUSTOMER_UPDATED',
    entity: 'CUSTOMER',
    entityId: customer._id,
    branch: customer.branch,
    changes: { before: previousData, after: data },
  });

  return customer;
};

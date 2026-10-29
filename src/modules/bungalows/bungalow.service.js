import { Bungalow } from './bungalow.model.js';
import { Branch } from '../branches/branch.model.js';
import { NotFoundError, ConflictError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const createBungalow = async (data, req) => {
  const branch = await Branch.findById(data.branch);
  if (!branch) {
    throw new NotFoundError(`Branch with id ${data.branch} not found`);
  }

  const existing = await Bungalow.findOne({
    branch: data.branch,
    number: data.number,
  });

  if (existing) {
    throw new ConflictError(`Bungalow ${data.number} already exists in ${branch.name} branch`);
  }

  const bungalow = await Bungalow.create(data);

  await logAudit({
    req,
    action: 'BUNGALOW_CREATED',
    entity: 'BUNGALOW',
    entityId: bungalow._id,
    branch: bungalow.branch,
    changes: { number: bungalow.number, category: bungalow.category, rent: bungalow.standardRent },
  });

  return bungalow;
};

export const getAllBungalows = async ({
  branchId,
  category,
  facility,
  isActive,
  maintenanceStatus,
  search,
  page = 1,
  limit = 50,
}) => {
  const filter = {};

  if (branchId) {
    const branch = await Branch.findById(branchId);
    if (branch && branch.type === 'HEAD_OFFICE') {
      const dhari = await Branch.findOne({ code: 'DHARI' });
      if (dhari) filter.branch = dhari._id;
    } else {
      filter.branch = branchId;
    }
  }
  if (category) filter.category = category;
  if (isActive !== undefined) filter.isActive = isActive;
  if (maintenanceStatus) filter.maintenanceStatus = maintenanceStatus;
  if (facility) filter.facilities = { $in: [facility] };

  if (search) {
    filter.$or = [
      { number: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [bungalows, total] = await Promise.all([
    Bungalow.find(filter)
      .populate('branch', 'name code')
      .sort({ number: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Bungalow.countDocuments(filter),
  ]);

  return {
    bungalows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getBungalowById = async id => {
  const bungalow = await Bungalow.findById(id).populate('branch', 'name code');
  if (!bungalow) {
    throw new NotFoundError(`Bungalow with id ${id} not found`);
  }
  return bungalow;
};

export const updateBungalow = async (id, data, req) => {
  const bungalow = await Bungalow.findById(id);
  if (!bungalow) {
    throw new NotFoundError(`Bungalow with id ${id} not found`);
  }

  if (data.number && data.number !== bungalow.number) {
    const targetBranch = data.branch || bungalow.branch;
    const existing = await Bungalow.findOne({
      _id: { $ne: id },
      branch: targetBranch,
      number: data.number,
    });

    if (existing) {
      throw new ConflictError(`Bungalow ${data.number} already exists in target branch`);
    }
  }

  const previousData = bungalow.toObject();
  Object.assign(bungalow, data);
  await bungalow.save();

  await logAudit({
    req,
    action: 'BUNGALOW_UPDATED',
    entity: 'BUNGALOW',
    entityId: bungalow._id,
    branch: bungalow.branch,
    changes: { before: previousData, after: data },
  });

  return bungalow;
};

export const deleteBungalow = async (id, req) => {
  const bungalow = await Bungalow.findById(id);
  if (!bungalow) {
    throw new NotFoundError(`Bungalow with id ${id} not found`);
  }

  await Bungalow.findByIdAndDelete(id);

  await logAudit({
    req,
    action: 'BUNGALOW_DELETED',
    entity: 'BUNGALOW',
    entityId: id,
    branch: bungalow.branch,
    changes: { number: bungalow.number, category: bungalow.category },
  });

  return { message: `Bungalow ${bungalow.number} deleted successfully` };
};

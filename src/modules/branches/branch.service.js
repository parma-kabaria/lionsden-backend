import { Branch } from './branch.model.js';
import { NotFoundError, ConflictError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const createBranch = async (data, req) => {
  const existing = await Branch.findOne({
    $or: [{ code: data.code }, { name: data.name }],
  });

  if (existing) {
    throw new ConflictError('A branch with this code or name already exists');
  }

  const branch = await Branch.create(data);

  await logAudit({
    req,
    action: 'BRANCH_CREATED',
    entity: 'BRANCH',
    entityId: branch._id,
    branch: branch._id,
    changes: data,
  });

  return branch;
};

export const getAllBranches = async ({ isActive, search } = {}) => {
  const filter = {};
  if (isActive !== undefined) {
    filter.isActive = isActive;
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  return Branch.find(filter).sort({ name: 1 });
};

export const getBranchById = async id => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError(`Branch with id ${id} not found`);
  }
  return branch;
};

export const updateBranch = async (id, data, req) => {
  const branch = await Branch.findById(id);
  if (!branch) {
    throw new NotFoundError(`Branch with id ${id} not found`);
  }

  if (data.code || data.name) {
    const existing = await Branch.findOne({
      _id: { $ne: id },
      $or: [
        ...(data.code ? [{ code: data.code }] : []),
        ...(data.name ? [{ name: data.name }] : []),
      ],
    });

    if (existing) {
      throw new ConflictError('Another branch with this code or name already exists');
    }
  }

  const previousData = branch.toObject();
  Object.assign(branch, data);
  await branch.save();

  await logAudit({
    req,
    action: 'BRANCH_UPDATED',
    entity: 'BRANCH',
    entityId: branch._id,
    branch: branch._id,
    changes: { before: previousData, after: data },
  });

  return branch;
};

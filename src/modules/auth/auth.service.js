import crypto from 'node:crypto';
import { User } from '../users/user.model.js';
import { RefreshToken } from './refresh-token.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../../common/utils/jwt.util.js';
import { UnauthorizedError, BadRequestError } from '../../common/errors/app.error.js';
import { logAudit } from '../audit-logs/audit-log.service.js';

export const login = async ({ email, password }, req) => {
  const user = await User.findOne({ email })
    .select('+password')
    .populate('role')
    .populate('branch');

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated. Please contact your administrator');
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Update last login
  user.lastLoginAt = new Date();
  await user.save();

  // Create token family
  const familyId = crypto.randomUUID();
  const tokenPayload = {
    userId: user._id,
    role: user.role.code,
    branchId: user.branch?._id || null,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const rawRefreshToken = generateRefreshToken({ userId: user._id, familyId });
  const tokenHash = hashToken(rawRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    tokenHash,
    userId: user._id,
    familyId,
    expiresAt,
    userAgent: req?.headers?.['user-agent'] || '',
    ipAddress: req?.ip || '',
  });

  await logAudit({
    req,
    actor: { userId: user._id, name: user.name, role: user.role.code },
    action: 'AUTH_LOGIN',
    entity: 'AUTH',
    entityId: user._id,
    branch: user.branch?._id || null,
    changes: { email: user.email },
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      branch: user.branch,
      lastLoginAt: user.lastLoginAt,
    },
    tokens: {
      accessToken,
      refreshToken: rawRefreshToken,
    },
  };
};

export const rotateRefreshToken = async (rawRefreshToken, req) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(rawRefreshToken);
  const tokenDoc = await RefreshToken.findOne({ tokenHash });

  if (!tokenDoc) {
    // If token exists in decoded but not in DB, possible reuse of a deleted token
    throw new UnauthorizedError('Refresh token not recognized');
  }

  // Reuse Detection: If this token was already revoked, someone is replaying an old token!
  // Invalidate the entire family of tokens for security.
  if (tokenDoc.isRevoked) {
    await RefreshToken.updateMany({ familyId: tokenDoc.familyId }, { $set: { isRevoked: true } });
    throw new UnauthorizedError('Revoked token reuse detected. All sessions revoked for security');
  }

  // Revoke current token
  tokenDoc.isRevoked = true;
  await tokenDoc.save();

  const user = await User.findById(decoded.userId).populate('role').populate('branch');
  if (!user || !user.isActive) {
    throw new UnauthorizedError('User account not found or deactivated');
  }

  // Generate new token pair under same familyId
  const tokenPayload = {
    userId: user._id,
    role: user.role.code,
    branchId: user.branch?._id || null,
  };

  const newAccessToken = generateAccessToken(tokenPayload);
  const newRefreshToken = generateRefreshToken({
    userId: user._id,
    familyId: tokenDoc.familyId,
  });
  const newTokenHash = hashToken(newRefreshToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    tokenHash: newTokenHash,
    userId: user._id,
    familyId: tokenDoc.familyId,
    expiresAt,
    userAgent: req?.headers?.['user-agent'] || '',
    ipAddress: req?.ip || '',
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

export const logout = async (rawRefreshToken, req) => {
  if (rawRefreshToken) {
    const tokenHash = hashToken(rawRefreshToken);
    await RefreshToken.updateOne({ tokenHash }, { $set: { isRevoked: true } });
  }

  if (req.user) {
    await logAudit({
      req,
      action: 'AUTH_LOGOUT',
      entity: 'AUTH',
      entityId: req.user._id,
      branch: req.user.branch?._id || null,
    });
  }

  return { message: 'Logged out successfully' };
};

export const changePassword = async ({ currentPassword, newPassword }, req) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new BadRequestError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  // Invalidate all active refresh tokens for this user
  await RefreshToken.updateMany({ userId: user._id }, { $set: { isRevoked: true } });

  await logAudit({
    req,
    action: 'AUTH_PASSWORD_CHANGED',
    entity: 'USER',
    entityId: user._id,
    branch: user.branch,
  });

  return { message: 'Password changed successfully. Please log in again' };
};

export const getProfile = async userId => {
  const user = await User.findById(userId)
    .populate('role', 'name code permissions')
    .populate('branch', 'name code address city');

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
};

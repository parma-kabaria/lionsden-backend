import * as authService from './auth.service.js';
import { sendSuccess } from '../../common/utils/response.util.js';

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, req);
    return sendSuccess(res, {
      data: result,
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.rotateRefreshToken(refreshToken, req);
    return sendSuccess(res, {
      data: tokens,
      message: 'Token rotated successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.logout(refreshToken, req);
    return sendSuccess(res, {
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.body, req);
    return sendSuccess(res, {
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user._id);
    return sendSuccess(res, {
      data: user,
      message: 'Profile retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
};

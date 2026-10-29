import { verifyAccessToken } from '../utils/jwt.util.js';
import { UnauthorizedError } from '../errors/app.error.js';
import { User } from '../../modules/users/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No authentication token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Bearer token is malformed');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      throw new UnauthorizedError('Token is invalid or expired');
    }

    const user = await User.findById(decoded.userId).populate('role').populate('branch').lean();

    if (!user) {
      throw new UnauthorizedError('User account not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account has been deactivated');
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    next(error);
  }
};

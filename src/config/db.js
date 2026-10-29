import dns from 'node:dns';
import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from './logger.js';

// Use public DNS servers only for local development on Windows / ISPs that fail SRV lookups.
// In AWS Lambda / Vercel, AWS has its own VPC DNS and blocks external port 53.
if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch {
    // Ignore and fallback to system DNS
  }
}

let isReplicaSet = false;
let connPromise = null;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connPromise) {
    return connPromise;
  }

  connPromise = (async () => {
    try {
      const conn = await mongoose.connect(config.db.uri, {
        autoIndex: true,
        serverSelectionTimeoutMS: 8000,
      });

      logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

      // Detect replica set status
      try {
        const admin = conn.connection.db.admin();
        const status = await admin.command({ replSetGetStatus: 1 });
        isReplicaSet = Boolean(status && status.ok === 1);
      } catch {
        isReplicaSet = false;
      }

      mongoose.connection.on('error', err => {
        logger.error({ err }, 'MongoDB runtime error');
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected. Reconnecting...');
        connPromise = null;
      });

      return conn;
    } catch (error) {
      connPromise = null;
      logger.error({ error }, 'Failed to connect to MongoDB');
      throw error;
    }
  })();

  return connPromise;
};

export const hasReplicaSet = () => isReplicaSet;

export const closeDatabase = async () => {
  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error while closing MongoDB connection');
  }
};

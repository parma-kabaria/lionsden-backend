import mongoose from 'mongoose';
import { config } from './index.js';
import { logger } from './logger.js';

let isReplicaSet = false;

export const connectDatabase = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(config.db.uri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 5000,
    });

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

    // Detect if connected to a replica set (required for multi-document ACID transactions)
    try {
      const admin = conn.connection.db.admin();
      const status = await admin.command({ replSetGetStatus: 1 });
      isReplicaSet = Boolean(status && status.ok === 1);
      logger.info(
        `MongoDB Replica Set status: ${isReplicaSet ? 'ENABLED (Transactions active)' : 'STANDALONE (Atomic operations fallback active)'}`
      );
    } catch {
      isReplicaSet = false;
      logger.info(
        'MongoDB Replica Set status: STANDALONE (Multi-document transactions not supported by standalone instance, atomic fallback active)'
      );
    }

    mongoose.connection.on('error', err => {
      logger.error({ err }, 'MongoDB runtime error');
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Reconnecting...');
    });

    return conn;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to MongoDB');
    throw error;
  }
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

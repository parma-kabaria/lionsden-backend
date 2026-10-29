import http from 'node:http';
import app from './app.js';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { connectDatabase, closeDatabase } from './config/db.js';

let server;

const startServer = async () => {
  try {
    // 1. Connect to Database
    await connectDatabase();

    // 2. Start HTTP Server
    server = http.createServer(app);

    server.listen(config.port, () => {
      logger.info(
        `LionsDen Resort Management Backend running in [${config.env}] mode on port ${config.port}`
      );
      logger.info(`REST API Prefix: http://localhost:${config.port}${config.apiPrefix}`);
      logger.info(`Swagger UI Docs: http://localhost:${config.port}/api-docs`);
    });
  } catch (error) {
    logger.fatal({ error }, 'Fatal error during server startup');
    process.exit(1);
  }
};

const gracefulShutdown = async signal => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      await closeDatabase();
      logger.info('Process termination complete. Goodbye!');
      process.exit(0);
    });

    // Force terminate if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', reason => {
  logger.error({ reason }, 'Unhandled Promise Rejection detected');
});

process.on('uncaughtException', error => {
  logger.fatal({ error }, 'Uncaught Exception detected');
  gracefulShutdown('uncaughtException');
});

startServer();

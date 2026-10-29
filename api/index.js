import app from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';

let dbConnectionPromise = null;

// Middleware to ensure database is connected for API requests
app.use(async (req, res, next) => {
  // Allow root and health check endpoints to respond immediately without DB
  if (req.path === '/' || req.path === '/health') {
    return next();
  }

  try {
    if (!dbConnectionPromise) {
      dbConnectionPromise = connectDatabase();
    }
    await dbConnectionPromise;
    next();
  } catch (error) {
    dbConnectionPromise = null; // allow retry on subsequent requests
    console.error('Database connection error in Vercel Serverless:', error);
    return res.status(500).json({
      success: false,
      message:
        'Database connection failed. Please ensure MONGODB_URI is configured in Vercel Environment Variables and MongoDB Atlas allows access from 0.0.0.0/0.',
      error: error.message,
    });
  }
});

export default app;

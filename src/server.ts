 
/* eslint-disable no-console */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import logSymbols from 'log-symbols';
import routes from './routes/index.ts';
import compression from 'compression';
import { setupSwagger } from './utils/swagger.ts';
import { errorHandler } from './middleware/error.middleware.ts';
import { requestLogger } from './middleware/logger.middleware.ts';
import { securityHeaders } from './middleware/security.middleware.ts';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware.ts';
import { safelyApplyMiddleware } from './utils/middleware.utils.ts';

/**
 * @swagger
 * info:
 *   title: Case Management API
 *   description: API for managing case information
 *   version: 1.0.0
 *   contact:
 *     name: HMCTS
 */

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

safelyApplyMiddleware(app, 'JSON parser', () => app.use(express.json()));
safelyApplyMiddleware(app, 'URL encoded parser', () =>
  app.use(express.urlencoded({ extended: true })),
);
safelyApplyMiddleware(app, 'CORS', () => app.use(cors()));

safelyApplyMiddleware(app, 'Security headers', () => app.use(securityHeaders));

safelyApplyMiddleware(app, 'Compression', () => app.use(compression()));

safelyApplyMiddleware(app, 'Request logger', () => app.use(requestLogger));

const apiPath = '/api';
const authPath = '/api/auth';
safelyApplyMiddleware(app, 'API rate limiter', () => app.use(apiPath, apiLimiter));
safelyApplyMiddleware(app, 'Auth rate limiter', () => app.use(authPath, authLimiter));

safelyApplyMiddleware(app, 'API routes', () => app.use('/api', routes));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (typeof setupSwagger === 'function') {
  safelyApplyMiddleware(app, 'Swagger documentation', () => setupSwagger(app));
}

safelyApplyMiddleware(app, 'Error handler', () => app.use(errorHandler));

if (process.env.NODE_ENV !== 'test') {
  try {
    app.listen(port, () => {
      console.log(logSymbols.success, `Server is running on port ${port}`);
      console.log(
        logSymbols.info,
        `API Documentation available at http://localhost:${port}/api-docs`,
      );
    });
  } catch (error) {
    console.error(
      logSymbols.error,
      `Failed to start server:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
}

export default app;

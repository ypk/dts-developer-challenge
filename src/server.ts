/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.ts';
import compression from 'compression';
import { setupSwagger } from './utils/swagger.ts';
import { errorHandler } from './middleware/error.middleware.ts';
import { requestLogger } from './middleware/logger.middleware.ts';
import { apiLimiter, authLimiter, speedLimiter } from './middleware/rate-limit.middleware.ts';

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(requestLogger);

app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (typeof setupSwagger === 'function') {
  setupSwagger(app);
}

app.use(errorHandler);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
  });
}

export default app;

/* eslint-disable no-console */
import express from 'express';
import dotenv from 'dotenv';
import routes from './routes/index.ts';
import { setupSwagger } from './utils/swagger.ts';
import { errorHandler } from './middleware/error.middleware.ts';

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

app.use(errorHandler);

if (typeof setupSwagger === 'function') {
  setupSwagger(app);
}

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`API Documentation available at http://localhost:${port}/api-docs`);
  });
}

export default app;

/**
 * API Routes Module
 * @module routes
 * @description Main router that consolidates all API route modules
 */

import { Router } from 'express';
import caseRoutes from './caseRoutes.ts';

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Case management endpoints
 */

/**
 * Express router instance for the main API routes
 * @type {Router}
 */
const router = Router();

/**
 * Mount the case management routes under the /cases path
 * @name cases-routes
 * @function
 * @memberof module:routes
 * @inner
 */
router.use('/cases', caseRoutes);

export default router;

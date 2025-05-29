/**
 * ESM Import Note:
 * Using .js extensions because this project uses ES Modules with NodeNext resolution.
 * TypeScript compiles .ts → .js, so import paths must reference the output files.
 */

/**
 * Frontend Routes Module
 * @module frontendRoutes
 * @description Main router for frontend views
 */
import { Router } from 'express';
import viewRoutes from './viewRoutes.js';

/**
 * Express router instance for the frontend routes
 * @type {Router}
 */
const router = Router();

router.use('/', viewRoutes);

export default router;

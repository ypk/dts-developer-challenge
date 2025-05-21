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

// Mount the view routes
router.use('/', viewRoutes);

export default router;

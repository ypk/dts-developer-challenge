import { Router } from 'express';
import caseRoutes from './caseRoutes.ts';

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Case management endpoints
 */
const router = Router();

router.use('/cases', caseRoutes);

export default router;

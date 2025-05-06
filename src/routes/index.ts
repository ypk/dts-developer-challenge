import Router from 'express';
import caseRoutes from './caseRoutes.ts';

const router = Router();

router.use('/cases', caseRoutes);

export default router;

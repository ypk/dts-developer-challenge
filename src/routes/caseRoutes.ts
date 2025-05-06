 
import { Router } from 'express';
import { caseController } from '../controllers/caseController.js';

const router = Router();

router.get('/', caseController.getAllCases);

router.get('/:id', caseController.getCaseById);

router.post('/', caseController.createCase);

router.put('/:id', caseController.updateCase);

router.patch('/:id/status', caseController.updateCaseStatus);

router.delete('/:id', caseController.deleteCase);

export default router;

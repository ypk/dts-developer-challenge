import express, { Request, Response } from 'express';

const router = express.Router();

router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Get all cases - Not implemented yet',
  });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10); // Parse to number
  res.status(200).json({
    success: true,
    message: `Get case with ID ${id} - Not implemented yet`,
  });
});

router.post('/', (req: Request, res: Response) => {
  const caseData = req.body as Record<string, unknown>;

  res.status(201).json({
    success: true,
    message: 'Create case - Not implemented yet',
    data: caseData,
  });
});

router.put('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const caseData = req.body as Record<string, unknown>;

  res.status(200).json({
    success: true,
    message: `Update case with ID ${id} - Not implemented yet`,
    data: caseData,
  });
});

router.patch('/:id/status', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const statusData = req.body as Record<string, unknown>;

  res.status(200).json({
    success: true,
    message: `Update status of case with ID ${id} - Not implemented yet`,
    data: statusData,
  });
});

router.delete('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);

  res.status(200).json({
    success: true,
    message: `Delete case with ID ${id} - Not implemented yet`,
  });
});

export default router;

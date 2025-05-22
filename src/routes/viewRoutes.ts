import { Router, Request, Response } from 'express';

const router = Router();

/**
 * Home page route
 * @name GET /
 */
router.get('/', (req: Request, res: Response) => {
  res.render('pages/home', {
    title: 'Home',
    pageHeading: 'Case Management System',
  });
});

/**
 * Error page route
 * @name GET /error
 */
router.get('/error', (req: Request, res: Response) => {
  const errorMessage = req.query.message || 'An unexpected error occurred';
  const errorStack = req.query.stack || '';

  res.render('pages/error', {
    title: 'Error',
    pageHeading: 'An error occurred',
    errorMessage,
    errorStack,
  });
});

export default router;

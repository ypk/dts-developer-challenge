import { Router, Request, Response } from 'express';
import { CaseServiceInstance } from '../services/CaseService.js';

const router = Router();

/**
 * Helper function to handle errors by redirecting to error page
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Error} error - The error that occurred
 * @param {string} defaultMessage - Default error message if error doesn't have one
 */
const handleErrorWithRedirect = (
  req: Request,
  res: Response,
  error: any,
  defaultMessage: string,
) => {
  const errorMessage = error instanceof Error ? error.message : defaultMessage;
  const errorStack = error instanceof Error ? error.stack : '';

  res.render('pages/error', {
    // Match this path to your actual error template
    title: 'Error',
    pageHeading: 'An error occurred',
    errorMessage,
    errorStack,
  });
};

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

/**
 * Cases list page route
 * @name GET /cases
 */
router.get('/cases', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await CaseServiceInstance.getAllCasesPaginated(page, limit);

    res.render('pages/cases/index', {
      title: 'All Cases',
      pageHeading: 'Case Management',
      cases: result.data,
      pagination: result.meta,
    });
  } catch (error) {
    handleErrorWithRedirect(req, res, error, 'An error occurred while loading cases');
  }
});

export default router;

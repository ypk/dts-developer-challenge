import { Router, Request, Response } from 'express';
import { CaseServiceInstance } from '../services/CaseService.ts';
import { NotFoundError } from '../middleware/error.middleware.ts';
import { caseValidation, validateForm } from '../middleware/validation.middleware.js';

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
    title: 'Error',
    pageHeading: 'An error occurred',
    errorMessage,
    errorStack,
  });
};

/**
 * Helper function to parse date string to Date object or null
 * @param {string} dateString - Date string from form
 * @returns {Date|null} - Date object or null if invalid
 */
const parseDate = (dateString: string): Date | null => {
  if (!dateString || dateString.trim() === '') {
    return null;
  }

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
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

/**
 * New case form route
 * @name GET /cases/new
 */
router.get('/cases/new', (req: Request, res: Response) => {
  res.render('pages/cases/new', {
    title: 'Create New Case',
    pageHeading: 'Create New Case',
    formData: {},
  });
});

/**
 * Create case route
 * @name POST /cases
 */
router.post('/cases', caseValidation.webForm, validateForm, async (req: Request, res: Response) => {
  try {
    if (!req.body.title || req.body.title.trim() === '') {
      throw new Error('Title is required');
    }

    const caseData = {
      title: req.body.title.trim(),
      description: req.body.description ? req.body.description.trim() : undefined,
      status: req.body.status,
      dueDate: parseDate(req.body.dueDate),
    };

    const newCase = await CaseServiceInstance.createCase(caseData);

    req.flash('success', 'Case created successfully');
    res.redirect(`/cases/${newCase.id}`);
  } catch (error) {
    req.flash('error', error instanceof Error ? error.message : 'An error occurred');

    res.render('pages/cases/new', {
      title: 'Create New Case',
      pageHeading: 'Create New Case',
      formData: req.body,
      error: error instanceof Error ? error.message : 'An error occurred',
    });
  }
});

/**
 * Case details route
 * @name GET /cases/:id
 */
router.get('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.id);

    if (isNaN(caseId)) {
      throw new Error('Invalid case ID');
    }

    const caseData = await CaseServiceInstance.getCaseById(caseId);

    res.render('pages/cases/details', {
      title: `Case #${caseId}`,
      pageHeading: `Case: ${caseData.title}`,
      caseData,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      req.flash('error', error.message);
      return res.redirect('/cases');
    }

    handleErrorWithRedirect(req, res, error, 'An error occurred while retrieving the case');
  }
});

/**
 * Edit case form route
 * @name GET /cases/:id/edit
 */
router.get('/cases/:id/edit', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.id);

    if (isNaN(caseId)) {
      throw new Error('Invalid case ID');
    }

    const caseData = await CaseServiceInstance.getCaseById(caseId);

    res.render('pages/cases/edit', {
      title: `Edit Case #${caseId}`,
      pageHeading: `Edit Case: ${caseData.title}`,
      caseData,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      req.flash('error', error.message);
      return res.redirect('/cases');
    }

    handleErrorWithRedirect(
      req,
      res,
      error,
      'An error occurred while retrieving the case for editing',
    );
  }
});

/**
 * Update case route
 * @name PUT /cases/:id
 */
router.put('/cases/:id', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.id);

    if (isNaN(caseId)) {
      req.flash('error', 'Invalid case ID');
      throw new Error('Invalid case ID');
    }

    if (!req.body.title || req.body.title.trim() === '') {
      throw new Error('Title is required');
    }

    const caseData = {
      title: req.body.title.trim(),
      description: req.body.description !== undefined ? req.body.description.trim() : null,
      status: req.body.status,
      dueDate: parseDate(req.body.dueDate),
    };

    await CaseServiceInstance.updateCase(caseId, caseData);

    req.flash('success', 'Case updated successfully');
    res.redirect(`/cases/${caseId}`);
  } catch (error) {
    if (error instanceof NotFoundError) {
      req.flash('error', error.message);
      return res.redirect('/cases');
    }

    req.flash('error', error instanceof Error ? error.message : 'An error occurred');
    res.redirect(`/cases/${req.params.id}/edit`);
  }
});

/**
 * Case deletion confirmation page
 * @name GET /cases/:id/delete
 */
router.get('/cases/:id/delete', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      req.flash('error', 'Invalid case ID');
      return res.redirect('/cases');
    }

    const caseData = await CaseServiceInstance.getCaseById(id);

    res.render('pages/cases/confirm-delete', {
      title: `Delete Case #${id}`,
      pageHeading: `Are you sure you want to delete this case?`,
      caseData,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      req.flash('error', error.message);
      return res.redirect('/cases');
    }

    req.flash('error', error instanceof Error ? error.message : 'An error occurred');
    res.redirect('/cases');
  }
});

/**
 * Delete case route
 * @name DELETE /cases/:id/delete
 */
router.delete('/cases/:id/delete', async (req: Request, res: Response) => {
  try {
    const caseId = parseInt(req.params.id);

    if (isNaN(caseId)) {
      throw new Error('Invalid case ID');
    }

    await CaseServiceInstance.deleteCase(caseId);

    req.flash('success', 'Case deleted successfully');
    res.redirect('/cases');
  } catch (error) {
    handleErrorWithRedirect(req, res, error, 'An error occurred while deleting the case');
  }
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

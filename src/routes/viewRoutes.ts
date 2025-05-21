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

export default router;

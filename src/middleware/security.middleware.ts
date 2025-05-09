import { Request, Response, NextFunction } from 'express';

const NO_SNIFF = 'nosniff';
const SAME_ORIGIN = 'SAMEORIGIN';

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', NO_SNIFF);
  res.setHeader('X-Frame-Options', SAME_ORIGIN);
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.removeHeader('X-Powered-By');
  next();
};

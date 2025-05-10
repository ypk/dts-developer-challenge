/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      pagination: PaginationOptions;
    }
  }
}

import { Request, Response, NextFunction } from 'express';

export interface PaginationOptions {
  page: number;
  limit: number;
  skip: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export const paginationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  let page = parseInt(req.query.page as string) || DEFAULT_PAGE;
  let limit = parseInt(req.query.limit as string) || DEFAULT_LIMIT;

  if (page < 1) {
    page = DEFAULT_PAGE;
    req.query.page = DEFAULT_PAGE.toString();
  }

  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  } else if (limit < 1) {
    limit = DEFAULT_LIMIT;
  }

  const skip = (page - 1) * limit;

  req.pagination = {
    page,
    limit,
    skip,
  };

  next();
};

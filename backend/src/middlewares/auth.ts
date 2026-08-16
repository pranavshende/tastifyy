import type { Request, Response, NextFunction } from 'express';
import passport from '../config/passport.js';

// Passport JWT Authentication Middleware
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.status(401).json({ error: 'Unauthorized: Invalid token or user not found' });
      return;
    }
    req.user = user;
    next();
  })(req, res, next);
};

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user as any;
    if (!user || !allowedRoles.includes(user.role)) {
      res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
      return;
    }
    next();
  };
};

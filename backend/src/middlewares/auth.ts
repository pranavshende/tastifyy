import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import '../config/passport.js'; // Ensure passport is initialized

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  passport.authenticate('jwt', { session: false }, (err: any, user: any, info: any) => {
    if (err) {
      console.error('Authentication Error:', err);
      return res.status(500).json({ error: 'Internal Server Error during authentication' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token or session expired', details: info?.message });
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

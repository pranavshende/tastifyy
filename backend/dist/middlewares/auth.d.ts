import type { Request, Response, NextFunction } from 'express';
import '../config/passport.js';
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeRole: (allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map
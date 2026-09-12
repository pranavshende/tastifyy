import type { Request, Response } from 'express';
export declare const sendOtp: (req: Request, res: Response) => Promise<void>;
export declare const verifyOtp: (req: Request, res: Response) => Promise<void>;
export declare const register: (req: Request, res: Response) => Promise<void>;
export declare const login: (req: Request, res: Response) => Promise<void>;
export declare const me: (req: Request, res: Response) => Promise<void>;
export declare const logout: (req: Request, res: Response) => Promise<void>;
export declare const googleLogin: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=auth.controller.d.ts.map
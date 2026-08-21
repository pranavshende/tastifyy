import type { Request, Response } from 'express';
export declare const checkout: (req: Request, res: Response) => Promise<void>;
export declare const verifyPayment: (req: Request, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<void>;
export declare const getOrderById: (req: Request, res: Response) => Promise<void>;
export declare const rateOrder: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=order.controller.d.ts.map
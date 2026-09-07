import type { Request, Response } from 'express';
export declare const createLinkedAccount: (req: Request, res: Response) => Promise<void>;
export declare const createStakeholder: (req: Request, res: Response) => Promise<void>;
export declare const configureRouteProduct: (req: Request, res: Response) => Promise<void>;
export declare const triggerPayout: (req: Request, res: Response) => Promise<void>;
export declare const handleRazorpayWebhook: (req: Request, res: Response) => Promise<void>;
export declare const processRefund: (order_id: string, reason?: string, isPartialRefund?: boolean, refundAmount?: number) => Promise<{
    success: boolean;
    refundId?: string;
    error?: string;
}>;
//# sourceMappingURL=payment.controller.d.ts.map
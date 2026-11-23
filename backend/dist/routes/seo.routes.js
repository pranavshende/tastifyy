import { Router } from 'express';
import { getSitemap } from '../controllers/seo.controller.js';
const router = Router();
router.get('/sitemap.xml', getSitemap);
export default router;
//# sourceMappingURL=seo.routes.js.map
import express from 'express'; import { requireAuth, requireAdmin } from '../middleware/auth.js'; import { dashboard } from '../controllers/adminController.js';
const router=express.Router(); router.get('/dashboard', requireAuth, requireAdmin, dashboard); export default router;

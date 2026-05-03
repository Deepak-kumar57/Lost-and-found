import express from 'express';
import multer from 'multer';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { createClaim, listClaims, getClaimDetail, updateClaimStatus } from '../controllers/claimController.js';
const router=express.Router(); const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024}});
router.get('/', requireAuth, listClaims);
router.get('/:id', requireAuth, requireAdmin, getClaimDetail);
router.post('/', requireAuth, upload.single('proof'), createClaim);
router.patch('/:id/status', requireAuth, requireAdmin, updateClaimStatus);
export default router;


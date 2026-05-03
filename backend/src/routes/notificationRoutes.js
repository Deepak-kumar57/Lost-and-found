import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications, markRead, markAllRead, unreadCount } from '../controllers/notificationController.js';

const router = express.Router();
router.get('/', requireAuth, listNotifications);
router.get('/unread-count', requireAuth, unreadCount);
router.patch('/read-all', requireAuth, markAllRead);
router.patch('/:id/read', requireAuth, markRead);
export default router;

import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { startConversation, listConversations, getMessages, sendMessage, listUsers } from '../controllers/chatController.js';

const router = express.Router();
router.use(requireAuth);
router.get('/users', listUsers);
router.get('/', listConversations);
router.post('/', startConversation);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
export default router;

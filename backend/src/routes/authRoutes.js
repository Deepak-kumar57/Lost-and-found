import express from 'express';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { register, login, me, registerSchema, loginSchema } from '../controllers/authController.js';
const router = express.Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', requireAuth, me);
export default router;

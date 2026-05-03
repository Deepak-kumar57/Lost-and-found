import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query } from '../config/db.js';
export const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(8) });
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
function sign(user) { return jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }); }
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const existing = await query('SELECT id FROM users WHERE email=$1', [email.toLowerCase()]);
    if (existing.rowCount) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 12);
    const result = await query('INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id,name,email,role,created_at', [name, email.toLowerCase(), passwordHash]);
    const user = result.rows[0];
    res.status(201).json({ user, token: sign(user) });
  } catch (e) { next(e); }
}
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await query('SELECT id,name,email,password_hash,role FROM users WHERE email=$1', [email.toLowerCase()]);
    if (!result.rowCount) return res.status(401).json({ message: 'Invalid email or password' });
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
    delete user.password_hash;
    res.json({ user, token: sign(user) });
  } catch (e) { next(e); }
}
export async function me(req, res) { res.json({ user: req.user }); }

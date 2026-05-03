import { z } from 'zod';
import { query } from '../config/db.js';
import { saveUpload } from '../services/fileService.js';

const rawItemSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters'),
  description: z.string().trim().min(5, 'Description must be at least 5 characters'),
  category: z.string().trim().min(2, 'Category must be at least 2 characters'),
  location: z.string().trim().min(2, 'Location must be at least 2 characters'),
  item_date: z.string().optional(),
  date_lost: z.string().optional(),
  date_found: z.string().optional(),
  handover_instructions: z.string().optional().nullable()
});

function normalizeItemBody(body, type) {
  const copy = { ...body };
  copy.item_date = copy.item_date || (type === 'lost' ? copy.date_lost : copy.date_found);
  return copy;
}

const itemSchema = rawItemSchema.superRefine((data, ctx) => {
  if (!data.item_date || Number.isNaN(Date.parse(data.item_date))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['item_date'], message: 'A valid item date is required' });
  }
});

function tableFor(type) {
  if (type === 'lost') return { table: 'lost_items', owner: 'user_id', date: 'date_lost' };
  if (type === 'found') return { table: 'found_items', owner: 'finder_id', date: 'date_found' };
  throw Object.assign(new Error('Invalid item type'), { status: 400 });
}

function formatZodErrors(error) {
  const flat = error.flatten();
  return Object.entries(flat.fieldErrors)
    .filter(([, messages]) => messages?.length)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('; ') || 'Validation failed';
}

export async function createItem(req, res, next) {
  try {
    const type = req.params.type;
    const meta = tableFor(type);
    const parsed = itemSchema.safeParse(normalizeItemBody(req.body, type));
    if (!parsed.success) {
      return res.status(400).json({
        message: formatZodErrors(parsed.error),
        errors: parsed.error.flatten()
      });
    }

    const imageUrl = await saveUpload(req.file);
    const { title, description, category, location, item_date, handover_instructions } = parsed.data;
    const result = await query(
      `INSERT INTO ${meta.table} (${meta.owner}, title, description, category, location, ${meta.date}, image_url, handover_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.id, title, description, category, location, item_date, imageUrl, handover_instructions || null]
    );
    res.status(201).json({ item: result.rows[0] });
  } catch (e) { next(e); }
}

export async function listItems(req, res, next) {
  try {
    const type = req.params.type;
    const meta = tableFor(type);
    const { q = '', category = '', location = '', status = '' } = req.query;
    const result = await query(
      `SELECT i.*, u.name as reporter_name, u.id as reporter_id
       FROM ${meta.table} i JOIN users u ON u.id = i.${meta.owner}
       WHERE ($1='' OR i.title ILIKE '%'||$1||'%' OR i.description ILIKE '%'||$1||'%')
         AND ($2='' OR i.category ILIKE $2)
         AND ($3='' OR i.location ILIKE '%'||$3||'%')
         AND ($4='' OR i.status=$4)
       ORDER BY i.created_at DESC LIMIT 100`, [q, category ? `%${category}%` : '', location, status]
    );
    res.json({ items: result.rows });
  } catch (e) { next(e); }
}

export async function getItem(req, res, next) {
  try {
    const type = req.params.type;
    const meta = tableFor(type);
    const result = await query(`SELECT * FROM ${meta.table} WHERE id=$1`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: result.rows[0] });
  } catch (e) { next(e); }
}

export async function updateItemStatus(req, res, next) {
  try {
    const type = req.params.type;
    const meta = tableFor(type);
    const { status } = req.body;
    if (!['pending','approved','rejected','claimed','archived'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const result = await query(`UPDATE ${meta.table} SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Item not found' });
    res.json({ item: result.rows[0] });
  } catch (e) { next(e); }
}

export async function smartSearch(req, res, next) {
  try {
    const { q = '', category = '', location = '' } = req.query;
    const cat = category ? `%${category}%` : '';
    const result = await query(
      `SELECT 'lost' as item_type, id, user_id as reporter_id, title, description, category, location, date_lost as item_date, image_url, status, created_at FROM lost_items
       WHERE status IN ('pending','approved','claimed') AND ($1='' OR title ILIKE '%'||$1||'%' OR description ILIKE '%'||$1||'%') AND ($2='' OR category ILIKE $2) AND ($3='' OR location ILIKE '%'||$3||'%')
       UNION ALL
       SELECT 'found' as item_type, id, finder_id as reporter_id, title, description, category, location, date_found as item_date, image_url, status, created_at FROM found_items
       WHERE status IN ('pending','approved','claimed') AND ($1='' OR title ILIKE '%'||$1||'%' OR description ILIKE '%'||$1||'%') AND ($2='' OR category ILIKE $2) AND ($3='' OR location ILIKE '%'||$3||'%')
       ORDER BY created_at DESC LIMIT 100`, [q, cat, location]
    );
    res.json({ items: result.rows });
  } catch (e) { next(e); }
}

export async function deleteItem(req, res, next) {
  try {
    const type = req.params.type;
    const meta = tableFor(type);
    await query('DELETE FROM claims WHERE item_id=$1 AND item_type=$2', [req.params.id, type]);
    const result = await query(`DELETE FROM ${meta.table} WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (e) { next(e); }
}


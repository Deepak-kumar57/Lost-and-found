import { z } from 'zod';
import { query } from '../config/db.js';
import { saveUpload } from '../services/fileService.js';
const claimSchema = z.object({ item_id: z.coerce.number().int().positive(), item_type: z.enum(['lost','found']), description: z.string().min(10) });
export async function createClaim(req, res, next) {
  try {
    const parsed = claimSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    const proofUrl = await saveUpload(req.file);
    const { item_id, item_type, description } = parsed.data;
    const result = await query('INSERT INTO claims (item_id,item_type,claimant_id,proof_url,description) VALUES ($1,$2,$3,$4,$5) RETURNING *', [item_id,item_type,req.user.id,proofUrl,description]);
    await query('INSERT INTO notifications (user_id,message,type) VALUES ($1,$2,$3)', [req.user.id, 'Your claim request was submitted and is pending review.', 'claim']);
    res.status(201).json({ claim: result.rows[0] });
  } catch(e){ next(e); }
}
export async function listClaims(req, res, next) {
  try {
    const base = req.user.role === 'admin' ? 'SELECT c.*, u.name claimant_name, u.email claimant_email FROM claims c JOIN users u ON u.id=c.claimant_id ORDER BY c.created_at DESC' : 'SELECT * FROM claims WHERE claimant_id=$1 ORDER BY created_at DESC';
    const result = await query(base, req.user.role === 'admin' ? [] : [req.user.id]);
    res.json({ claims: result.rows });
  } catch(e){ next(e); }
}
export async function getClaimDetail(req, res, next) {
  try {
    const claimResult = await query(
      'SELECT c.*, u.name claimant_name, u.email claimant_email FROM claims c JOIN users u ON u.id=c.claimant_id WHERE c.id=$1',
      [req.params.id]
    );
    if (!claimResult.rowCount) return res.status(404).json({ message: 'Claim not found' });
    const claim = claimResult.rows[0];
    const table = claim.item_type === 'lost' ? 'lost_items' : 'found_items';
    const ownerCol = claim.item_type === 'lost' ? 'user_id' : 'finder_id';
    const dateCol = claim.item_type === 'lost' ? 'date_lost' : 'date_found';
    const itemResult = await query(
      `SELECT i.*, u.name as reporter_name, u.email as reporter_email FROM ${table} i JOIN users u ON u.id=i.${ownerCol} WHERE i.id=$1`,
      [claim.item_id]
    );
    const item = itemResult.rows[0] || null;
    res.json({ claim, item });
  } catch(e){ next(e); }
}
export async function updateClaimStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!['pending','approved','rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const isApproved = status === 'approved';
    const result = await query(
      'UPDATE claims SET status=$1::varchar, resolved_at=CASE WHEN $2::boolean THEN NOW() ELSE resolved_at END WHERE id=$3 RETURNING *',
      [status, isApproved, req.params.id]
    );
    if (!result.rowCount) return res.status(404).json({ message: 'Claim not found' });
    const claim = result.rows[0];
    await query('INSERT INTO notifications (user_id,message,type) VALUES ($1,$2,$3)', [claim.claimant_id, `Your claim was ${status}.`, 'claim']);
    if (isApproved) {
      const table = claim.item_type === 'lost' ? 'lost_items' : 'found_items';
      await query(`UPDATE ${table} SET status='claimed', updated_at=NOW() WHERE id=$1`, [claim.item_id]);
    }
    res.json({ claim });
  } catch(e){ next(e); }
}

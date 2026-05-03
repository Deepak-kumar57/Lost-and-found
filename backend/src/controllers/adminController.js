import { query } from '../config/db.js';
export async function dashboard(req,res,next){
 try{
  const stats = await query(`SELECT
    (SELECT COUNT(*) FROM users) users,
    (SELECT COUNT(*) FROM lost_items) lost_items,
    (SELECT COUNT(*) FROM found_items) found_items,
    (SELECT COUNT(*) FROM claims WHERE status='pending') pending_claims,
    (SELECT COUNT(*) FROM lost_items WHERE status='claimed') claimed_lost,
    (SELECT COUNT(*) FROM found_items WHERE status='claimed') claimed_found`);
  const cats = await query(`SELECT category, COUNT(*)::int total FROM (
      SELECT category FROM lost_items UNION ALL SELECT category FROM found_items
    ) x GROUP BY category ORDER BY total DESC LIMIT 8`);
  res.json({ stats: stats.rows[0], categories: cats.rows });
 }catch(e){ next(e); }
}

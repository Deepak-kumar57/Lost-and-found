import { query } from '../config/db.js';

export async function listNotifications(req, res, next) {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (e) { next(e); }
}

export async function markRead(req, res, next) {
  try {
    await query(
      'UPDATE notifications SET is_read=true WHERE user_id=$1 AND id=$2',
      [req.user.id, req.params.id]
    );
    res.json({ message: 'Marked as read' });
  } catch (e) { next(e); }
}

export async function markAllRead(req, res, next) {
  try {
    await query(
      'UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (e) { next(e); }
}

export async function unreadCount(req, res, next) {
  try {
    const result = await query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id=$1 AND is_read=false',
      [req.user.id]
    );
    res.json({ count: result.rows[0].count });
  } catch (e) { next(e); }
}

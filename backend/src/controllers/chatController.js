import { query } from '../config/db.js';

async function assertParticipant(conversationId, userId) {
  const result = await query(
    `SELECT 1 FROM chat_participants WHERE conversation_id=$1 AND user_id=$2`,
    [conversationId, userId]
  );
  if (!result.rowCount) {
    throw Object.assign(new Error('You are not a participant in this conversation'), { status: 403 });
  }
}

export async function startConversation(req, res, next) {
  try {
    const { recipient_id } = req.body;
    if (!recipient_id) {
      return res.status(400).json({ message: 'recipient_id is required' });
    }
    if (Number(recipient_id) === Number(req.user.id)) {
      return res.status(400).json({ message: 'You cannot start a chat with yourself' });
    }

    // Check if a general conversation already exists between these two users
    const existing = await query(
      `SELECT c.*
       FROM chat_conversations c
       JOIN chat_participants p1 ON p1.conversation_id=c.id AND p1.user_id=$1
       JOIN chat_participants p2 ON p2.conversation_id=c.id AND p2.user_id=$2
       WHERE c.item_id IS NULL
       LIMIT 1`,
      [req.user.id, recipient_id]
    );

    if (existing.rowCount) return res.status(200).json({ conversation: existing.rows[0] });

    const created = await query(
      `INSERT INTO chat_conversations (item_id, item_type, created_by)
       VALUES (NULL, NULL, $1) RETURNING *`,
      [req.user.id]
    );
    const conversation = created.rows[0];
    await query(
      `INSERT INTO chat_participants (conversation_id, user_id) VALUES ($1,$2),($1,$3)`,
      [conversation.id, req.user.id, recipient_id]
    );
    res.status(201).json({ conversation });
  } catch (e) { next(e); }
}

export async function listConversations(req, res, next) {
  try {
    const result = await query(
      `SELECT c.*,
              m.body AS last_message,
              m.created_at AS last_message_at,
              json_agg(json_build_object('id', u.id, 'name', u.name, 'email', u.email)) AS participants
       FROM chat_conversations c
       JOIN chat_participants cp ON cp.conversation_id=c.id AND cp.user_id=$1
       JOIN chat_participants allp ON allp.conversation_id=c.id
       JOIN users u ON u.id=allp.user_id
       LEFT JOIN LATERAL (
         SELECT body, created_at FROM chat_messages WHERE conversation_id=c.id ORDER BY created_at DESC LIMIT 1
       ) m ON true
       GROUP BY c.id, m.body, m.created_at
       ORDER BY COALESCE(m.created_at, c.created_at) DESC`,
      [req.user.id]
    );
    res.json({ conversations: result.rows });
  } catch (e) { next(e); }
}

export async function getMessages(req, res, next) {
  try {
    await assertParticipant(req.params.id, req.user.id);
    const result = await query(
      `SELECT m.*, u.name AS sender_name
       FROM chat_messages m
       JOIN users u ON u.id=m.sender_id
       WHERE m.conversation_id=$1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );
    res.json({ messages: result.rows });
  } catch (e) { next(e); }
}

export async function sendMessage(req, res, next) {
  try {
    await assertParticipant(req.params.id, req.user.id);
    const body = String(req.body.body || '').trim();
    if (body.length < 1) return res.status(400).json({ message: 'Message cannot be empty' });
    if (body.length > 2000) return res.status(400).json({ message: 'Message is too long' });
    const result = await query(
      `INSERT INTO chat_messages (conversation_id, sender_id, body)
       VALUES ($1,$2,$3) RETURNING *`,
      [req.params.id, req.user.id, body]
    );
    await query(`UPDATE chat_conversations SET updated_at=NOW() WHERE id=$1`, [req.params.id]);
    res.status(201).json({ message: result.rows[0] });
  } catch (e) { next(e); }
}

export async function listUsers(req, res, next) {
  try {
    const result = await query(
      `SELECT id, name, email FROM users WHERE id != $1 AND is_active = true ORDER BY name ASC`,
      [req.user.id]
    );
    res.json({ users: result.rows });
  } catch (e) { next(e); }
}

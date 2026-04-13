const { pool } = require('../config/database');

const getMessages = async (req, res, next) => {
  try {
    const { case_id } = req.query;

    const result = await pool.query(`
      SELECT m.*, u.name AS sender_name, u.role AS sender_role
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.case_id = $1
      ORDER BY m.created_at ASC
    `, [case_id]);

    await pool.query(
      'UPDATE messages SET is_read = true WHERE case_id = $1 AND recipient_id = $2',
      [case_id, req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { case_id, recipient_id, content } = req.body;

    const result = await pool.query(`
      INSERT INTO messages (case_id, sender_id, recipient_id, content)
      VALUES ($1, $2, $3, $4)
      RETURNING *, (SELECT name FROM users WHERE id = $2) AS sender_name
    `, [case_id, req.user.id, recipient_id, content]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) AS count FROM messages WHERE recipient_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMessages, sendMessage, getUnreadCount };

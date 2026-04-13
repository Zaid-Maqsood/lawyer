const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const getClients = async (req, res, next) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT cl.*,
        COUNT(DISTINCT c.id) AS case_count,
        COUNT(DISTINCT m.id) AS unread_messages
      FROM clients cl
      LEFT JOIN cases c ON c.client_id = cl.id
      LEFT JOIN messages m ON m.recipient_id = cl.user_id AND m.is_read = false
    `;
    const params = [];

    if (search) {
      query += ` WHERE (cl.name ILIKE $1 OR cl.email ILIKE $1 OR cl.company ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ' GROUP BY cl.id ORDER BY cl.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const getClientById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await pool.query(`
      SELECT cl.*, u.email AS portal_email, u.is_active AS portal_active
      FROM clients cl
      LEFT JOIN users u ON cl.user_id = u.id
      WHERE cl.id = $1
    `, [id]);

    if (client.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    const cases = await pool.query(`
      SELECT c.*, u.name AS lawyer_name
      FROM cases c
      LEFT JOIN users u ON c.assigned_lawyer_id = u.id
      WHERE c.client_id = $1
      ORDER BY c.created_at DESC
    `, [id]);

    res.json({ ...client.rows[0], cases: cases.rows });
  } catch (err) {
    next(err);
  }
};

const createClient = async (req, res, next) => {
  try {
    const { name, email, phone, address, company, notes, create_portal_access, portal_password } = req.body;

    let userId = null;

    if (create_portal_access && portal_password) {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'A user with this email already exists.' });
      }

      const hashed = await bcrypt.hash(portal_password, 12);
      const userResult = await pool.query(`
        INSERT INTO users (name, email, password, role)
        VALUES ($1, $2, $3, 'client')
        RETURNING id
      `, [name, email, hashed]);
      userId = userResult.rows[0].id;
    }

    const result = await pool.query(`
      INSERT INTO clients (user_id, name, email, phone, address, company, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, name, email, phone, address, company, notes]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, company, notes } = req.body;

    const result = await pool.query(`
      UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, company=$5, notes=$6, updated_at=NOW()
      WHERE id=$7 RETURNING *
    `, [name, email, phone, address, company, notes, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    res.json({ message: 'Client deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };

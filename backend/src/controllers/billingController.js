const { pool } = require('../config/database');

const getTimeLogs = async (req, res, next) => {
  try {
    const { case_id, user_id } = req.query;
    let query = `
      SELECT tl.*, u.name AS lawyer_name, c.title AS case_title
      FROM time_logs tl
      LEFT JOIN users u ON tl.user_id = u.id
      LEFT JOIN cases c ON tl.case_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (case_id) { conditions.push(`tl.case_id = $${params.length + 1}`); params.push(case_id); }
    if (user_id) { conditions.push(`tl.user_id = $${params.length + 1}`); params.push(user_id); }
    if (req.user.role === 'lawyer') { conditions.push(`tl.user_id = $${params.length + 1}`); params.push(req.user.id); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY tl.date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createTimeLog = async (req, res, next) => {
  try {
    const { case_id, description, hours, date } = req.body;

    const userResult = await pool.query('SELECT hourly_rate FROM users WHERE id = $1', [req.user.id]);
    const hourly_rate = userResult.rows[0]?.hourly_rate || 0;

    const result = await pool.query(`
      INSERT INTO time_logs (case_id, user_id, description, hours, hourly_rate, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [case_id, req.user.id, description, hours, hourly_rate, date || new Date()]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateTimeLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { description, hours, date, is_billed } = req.body;

    const result = await pool.query(`
      UPDATE time_logs SET description=$1, hours=$2, date=$3, is_billed=$4, updated_at=NOW()
      WHERE id=$5 AND user_id=$6
      RETURNING *
    `, [description, hours, date, is_billed, id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Time log not found or unauthorized.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteTimeLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM time_logs WHERE id = $1 AND user_id = $2', [id, req.user.id]);
    res.json({ message: 'Time log deleted.' });
  } catch (err) {
    next(err);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const { case_id, client_id, status } = req.query;
    let query = `
      SELECT i.*, cl.name AS client_name, c.title AS case_title
      FROM invoices i
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN cases c ON i.case_id = c.id
    `;
    const conditions = [];
    const params = [];

    if (case_id) { conditions.push(`i.case_id = $${params.length + 1}`); params.push(case_id); }
    if (client_id) { conditions.push(`i.client_id = $${params.length + 1}`); params.push(client_id); }
    if (status) { conditions.push(`i.status = $${params.length + 1}`); params.push(status); }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY i.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createInvoice = async (req, res, next) => {
  try {
    const { case_id, client_id, due_date, notes, tax_rate = 0, include_time_logs } = req.body;

    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 9000) + 1000;
    const invoice_number = `INV-${year}-${random}`;

    let line_items = req.body.line_items || [];
    let subtotal = 0;

    if (include_time_logs && case_id) {
      const timeLogs = await pool.query(`
        SELECT tl.*, u.name AS lawyer_name
        FROM time_logs tl
        LEFT JOIN users u ON tl.user_id = u.id
        WHERE tl.case_id = $1 AND tl.is_billed = false
      `, [case_id]);

      timeLogs.rows.forEach(log => {
        const amount = log.hours * log.hourly_rate;
        subtotal += amount;
        line_items.push({
          description: `${log.lawyer_name} - ${log.description} (${log.hours}h @ $${log.hourly_rate}/hr)`,
          quantity: log.hours,
          rate: log.hourly_rate,
          amount
        });
      });

      if (timeLogs.rows.length > 0) {
        const ids = timeLogs.rows.map(r => r.id);
        await pool.query('UPDATE time_logs SET is_billed = true WHERE id = ANY($1)', [ids]);
      }
    } else {
      subtotal = line_items.reduce((sum, item) => sum + (item.amount || 0), 0);
    }

    const tax_amount = subtotal * (tax_rate / 100);
    const total = subtotal + tax_amount;

    const result = await pool.query(`
      INSERT INTO invoices (case_id, client_id, invoice_number, subtotal, tax_rate, tax_amount, total, due_date, notes, line_items)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [case_id, client_id, invoice_number, subtotal, tax_rate, tax_amount, total, due_date, notes, JSON.stringify(line_items)]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateInvoiceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, paid_date } = req.body;

    const result = await pool.query(`
      UPDATE invoices SET status=$1, paid_date=$2, updated_at=NOW()
      WHERE id=$3 RETURNING *
    `, [status, paid_date, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT i.*, cl.name AS client_name, cl.email AS client_email, cl.address AS client_address,
        c.title AS case_title, c.case_number
      FROM invoices i
      LEFT JOIN clients cl ON i.client_id = cl.id
      LEFT JOIN cases c ON i.case_id = c.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog, getInvoices, createInvoice, updateInvoiceStatus, getInvoiceById };

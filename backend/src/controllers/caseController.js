const { pool } = require('../config/database');

const generateCaseNumber = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `CASE-${year}-${random}`;
};

const getCases = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT c.*,
        cl.name AS client_name, cl.email AS client_email,
        u.name AS lawyer_name,
        COUNT(d.id) AS document_count,
        COALESCE(SUM(tl.hours), 0) AS total_hours
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_lawyer_id = u.id
      LEFT JOIN documents d ON d.case_id = c.id
      LEFT JOIN time_logs tl ON tl.case_id = c.id
    `;

    const params = [];
    const conditions = [];

    if (req.user.role === 'client') {
      const clientResult = await pool.query('SELECT id FROM clients WHERE user_id = $1', [req.user.id]);
      if (clientResult.rows.length > 0) {
        conditions.push(`c.client_id = $${params.length + 1}`);
        params.push(clientResult.rows[0].id);
      }
    } else if (req.user.role === 'lawyer') {
      conditions.push(`c.assigned_lawyer_id = $${params.length + 1}`);
      params.push(req.user.id);
    }

    if (status) {
      conditions.push(`c.status = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(c.title ILIKE $${params.length + 1} OR c.case_number ILIKE $${params.length + 1} OR cl.name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ` GROUP BY c.id, cl.name, cl.email, u.name ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(DISTINCT c.id) FROM cases c LEFT JOIN clients cl ON c.client_id = cl.id ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}`;
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      cases: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    next(err);
  }
};

const getCaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*,
        cl.name AS client_name, cl.email AS client_email, cl.phone AS client_phone,
        u.name AS lawyer_name, u.email AS lawyer_email
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_lawyer_id = u.id
      WHERE c.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const timeline = await pool.query(`
      SELECT ct.*, u.name AS user_name FROM case_timeline ct
      LEFT JOIN users u ON ct.user_id = u.id
      WHERE ct.case_id = $1 ORDER BY ct.created_at DESC
    `, [id]);

    res.json({ ...result.rows[0], timeline: timeline.rows });
  } catch (err) {
    next(err);
  }
};

const createCase = async (req, res, next) => {
  try {
    const {
      title, description, client_id, assigned_lawyer_id,
      status, priority, practice_area, court, filing_date, due_date
    } = req.body;

    const case_number = generateCaseNumber();

    const result = await pool.query(`
      INSERT INTO cases (title, description, client_id, assigned_lawyer_id, status, priority, case_number, practice_area, court, filing_date, due_date)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *
    `, [title, description, client_id, assigned_lawyer_id || req.user.id, status || 'open', priority || 'medium', case_number, practice_area, court, filing_date, due_date]);

    await pool.query(`
      INSERT INTO case_timeline (case_id, user_id, event_type, title, description)
      VALUES ($1, $2, 'created', 'Case Created', $3)
    `, [result.rows[0].id, req.user.id, `Case "${title}" was created`]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const updateCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      title, description, client_id, assigned_lawyer_id,
      status, priority, practice_area, court, filing_date, due_date, closed_date
    } = req.body;

    const existing = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const result = await pool.query(`
      UPDATE cases SET
        title=$1, description=$2, client_id=$3, assigned_lawyer_id=$4,
        status=$5, priority=$6, practice_area=$7, court=$8,
        filing_date=$9, due_date=$10, closed_date=$11, updated_at=NOW()
      WHERE id=$12
      RETURNING *
    `, [title, description, client_id, assigned_lawyer_id, status, priority, practice_area, court, filing_date, due_date, closed_date, id]);

    if (existing.rows[0].status !== status) {
      await pool.query(`
        INSERT INTO case_timeline (case_id, user_id, event_type, title, description)
        VALUES ($1, $2, 'status_change', 'Status Updated', $3)
      `, [id, req.user.id, `Status changed from "${existing.rows[0].status}" to "${status}"`]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteCase = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cases WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    res.json({ message: 'Case deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const addTimelineEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { event_type, title, description } = req.body;

    const result = await pool.query(`
      INSERT INTO case_timeline (case_id, user_id, event_type, title, description)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *, (SELECT name FROM users WHERE id = $2) AS user_name
    `, [id, req.user.id, event_type || 'note', title, description]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getCases, getCaseById, createCase, updateCase, deleteCase, addTimelineEvent };

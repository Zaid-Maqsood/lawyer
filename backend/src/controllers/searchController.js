const { pool } = require('../config/database');

const globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ cases: [], documents: [], clients: [] });
    }

    const searchTerm = `%${q.trim()}%`;

    const [cases, documents, clients] = await Promise.all([
      pool.query(`
        SELECT c.id, c.title, c.case_number, c.status, c.priority, cl.name AS client_name
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        WHERE c.title ILIKE $1 OR c.case_number ILIKE $1 OR c.description ILIKE $1 OR cl.name ILIKE $1
        LIMIT 10
      `, [searchTerm]),

      pool.query(`
        SELECT d.id, d.name, d.original_name, d.document_type, d.created_at, c.title AS case_title
        FROM documents d
        LEFT JOIN cases c ON d.case_id = c.id
        WHERE d.name ILIKE $1 OR d.original_name ILIKE $1 OR d.description ILIKE $1
        LIMIT 10
      `, [searchTerm]),

      pool.query(`
        SELECT id, name, email, phone, company
        FROM clients
        WHERE name ILIKE $1 OR email ILIKE $1 OR company ILIKE $1
        LIMIT 10
      `, [searchTerm])
    ]);

    res.json({
      cases: cases.rows,
      documents: documents.rows,
      clients: clients.rows,
      query: q
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { globalSearch };

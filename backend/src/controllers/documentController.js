const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const getDocuments = async (req, res, next) => {
  try {
    const { case_id, search } = req.query;
    let query = `
      SELECT d.*, u.name AS uploaded_by_name, c.title AS case_title
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN cases c ON d.case_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (case_id) {
      conditions.push(`d.case_id = $${params.length + 1}`);
      params.push(case_id);
    }

    if (search) {
      conditions.push(`(d.name ILIKE $${params.length + 1} OR d.original_name ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const { case_id, document_type, description, name } = req.body;

    const result = await pool.query(`
      INSERT INTO documents (case_id, uploaded_by, name, original_name, file_path, file_size, mime_type, document_type, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      case_id,
      req.user.id,
      name || req.file.originalname,
      req.file.originalname,
      req.file.filename,
      req.file.size,
      req.file.mimetype,
      document_type || 'general',
      description
    ]);

    if (case_id) {
      await pool.query(`
        INSERT INTO case_timeline (case_id, user_id, event_type, title)
        VALUES ($1, $2, 'document', $3)
      `, [case_id, req.user.id, `Document uploaded: ${req.file.originalname}`]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT d.*, u.name AS uploaded_by_name, c.title AS case_title
      FROM documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      LEFT JOIN cases c ON d.case_id = c.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = result.rows[0];
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, doc.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server.' });
    }

    res.download(filePath, doc.original_name);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = result.rows[0];
    const uploadPath = process.env.UPLOAD_PATH || './uploads';
    const filePath = path.join(uploadPath, doc.file_path);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await pool.query('DELETE FROM documents WHERE id = $1', [id]);
    res.json({ message: 'Document deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

const updateDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, document_type, description } = req.body;

    const result = await pool.query(`
      UPDATE documents SET name=$1, document_type=$2, description=$3, updated_at=NOW()
      WHERE id=$4 RETURNING *
    `, [name, document_type, description, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { getDocuments, uploadDocument, getDocumentById, downloadDocument, deleteDocument, updateDocument };

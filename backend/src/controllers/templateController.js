const { pool } = require('../config/database');

const getTemplates = async (req, res, next) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM templates WHERE is_active = true';
    const params = [];

    if (category) {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  try {
    const { name, description, content, category, variables } = req.body;

    const result = await pool.query(`
      INSERT INTO templates (created_by, name, description, content, category, variables)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.user.id, name, description, content, category, JSON.stringify(variables || [])]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const getTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const fillTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { variables } = req.body;

    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    let content = result.rows[0].content;

    if (variables && typeof variables === 'object') {
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        content = content.replace(regex, value || '');
      });
    }

    res.json({ content, template_name: result.rows[0].name });
  } catch (err) {
    next(err);
  }
};

const updateTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, content, category, variables } = req.body;

    const result = await pool.query(`
      UPDATE templates SET name=$1, description=$2, content=$3, category=$4, variables=$5, updated_at=NOW()
      WHERE id=$6 RETURNING *
    `, [name, description, content, category, JSON.stringify(variables || []), id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    await pool.query('UPDATE templates SET is_active = false WHERE id = $1', [id]);
    res.json({ message: 'Template deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTemplates, createTemplate, getTemplateById, fillTemplate, updateTemplate, deleteTemplate };

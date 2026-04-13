const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

const getOpenAI = () => {
  const OpenAI = require('openai');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const readDocumentText = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const fullPath = path.join(process.env.UPLOAD_PATH || './uploads', filePath);

  if (!fs.existsSync(fullPath)) {
    throw new Error('Document file not found');
  }

  if (ext === '.txt') {
    return fs.readFileSync(fullPath, 'utf8');
  }

  if (ext === '.pdf') {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(fullPath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  return `[Document: ${path.basename(filePath)} - text extraction not available for this format]`;
};

const summarizeDocument = async (req, res, next) => {
  try {
    const { document_id } = req.params;
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [document_id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docResult.rows[0];
    const text = await readDocumentText(doc.file_path);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal document analyst. Provide clear, concise summaries of legal documents highlighting the most important points for lawyers.'
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary of this legal document:\n\n${text.substring(0, 8000)}`
        }
      ],
      max_tokens: 1000
    });

    const summary = completion.choices[0].message.content;

    await pool.query(
      'UPDATE documents SET ai_summary = $1, is_processed = true, updated_at = NOW() WHERE id = $2',
      [summary, document_id]
    );

    res.json({ summary, document_id });
  } catch (err) {
    next(err);
  }
};

const extractKeyClauses = async (req, res, next) => {
  try {
    const { document_id } = req.params;
    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [document_id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docResult.rows[0];
    const text = await readDocumentText(doc.file_path);
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal document analyst. Extract and identify key legal clauses, obligations, rights, deadlines, and important provisions from legal documents. Return a JSON array of clauses.'
        },
        {
          role: 'user',
          content: `Extract the key clauses from this legal document and return them as a JSON array with objects containing "type", "title", and "content" fields:\n\n${text.substring(0, 8000)}`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000
    });

    let clauses = [];
    try {
      const parsed = JSON.parse(completion.choices[0].message.content);
      clauses = parsed.clauses || parsed.key_clauses || [];
    } catch {
      clauses = [{ type: 'general', title: 'Extracted Content', content: completion.choices[0].message.content }];
    }

    await pool.query(
      'UPDATE documents SET ai_key_clauses = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(clauses), document_id]
    );

    res.json({ clauses, document_id });
  } catch (err) {
    next(err);
  }
};

const askQuestion = async (req, res, next) => {
  try {
    const { document_id } = req.params;
    const { question, conversation_history = [] } = req.body;

    const docResult = await pool.query('SELECT * FROM documents WHERE id = $1', [document_id]);

    if (docResult.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = docResult.rows[0];
    const text = await readDocumentText(doc.file_path);
    const openai = getOpenAI();

    const messages = [
      {
        role: 'system',
        content: `You are an expert legal assistant. Answer questions about the following legal document accurately and helpfully. If the answer is not in the document, say so clearly.\n\nDocument:\n${text.substring(0, 6000)}`
      },
      ...conversation_history.slice(-6),
      { role: 'user', content: question }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 800
    });

    const answer = completion.choices[0].message.content;
    res.json({ answer, question });
  } catch (err) {
    next(err);
  }
};

const chatWithAI = async (req, res, next) => {
  try {
    const { message, case_id, conversation_history = [] } = req.body;

    let caseContext = '';
    if (case_id) {
      const caseResult = await pool.query(`
        SELECT c.*, cl.name AS client_name, u.name AS lawyer_name
        FROM cases c
        LEFT JOIN clients cl ON c.client_id = cl.id
        LEFT JOIN users u ON c.assigned_lawyer_id = u.id
        WHERE c.id = $1
      `, [case_id]);

      if (caseResult.rows.length > 0) {
        const c = caseResult.rows[0];
        caseContext = `\nCase Context:\n- Title: ${c.title}\n- Status: ${c.status}\n- Client: ${c.client_name}\n- Lawyer: ${c.lawyer_name}\n- Practice Area: ${c.practice_area}\n- Description: ${c.description}`;
      }
    }

    const openai = getOpenAI();

    const messages = [
      {
        role: 'system',
        content: `You are LexAI, an expert AI legal assistant for law firms. Help lawyers with case strategy, legal research, document drafting, and legal analysis. Be professional, accurate, and helpful.${caseContext}`
      },
      ...conversation_history.slice(-10),
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 1200
    });

    const response = completion.choices[0].message.content;
    res.json({ response, message });
  } catch (err) {
    next(err);
  }
};

const analyzeCase = async (req, res, next) => {
  try {
    const { case_id } = req.params;

    const caseResult = await pool.query(`
      SELECT c.*, cl.name AS client_name, u.name AS lawyer_name
      FROM cases c
      LEFT JOIN clients cl ON c.client_id = cl.id
      LEFT JOIN users u ON c.assigned_lawyer_id = u.id
      WHERE c.id = $1
    `, [case_id]);

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Case not found.' });
    }

    const caseData = caseResult.rows[0];

    const timelineResult = await pool.query(
      'SELECT * FROM case_timeline WHERE case_id = $1 ORDER BY created_at DESC LIMIT 20',
      [case_id]
    );

    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert legal strategist. Analyze cases and provide strategic insights, potential risks, recommendations, and next steps.'
        },
        {
          role: 'user',
          content: `Analyze this legal case and provide strategic insights:\n\nCase: ${caseData.title}\nStatus: ${caseData.status}\nPriority: ${caseData.priority}\nPractice Area: ${caseData.practice_area}\nClient: ${caseData.client_name}\nDescription: ${caseData.description}\n\nRecent Timeline:\n${timelineResult.rows.map(t => `- ${t.title}: ${t.description}`).join('\n')}`
        }
      ],
      max_tokens: 1000
    });

    res.json({ analysis: completion.choices[0].message.content, case_id });
  } catch (err) {
    next(err);
  }
};

module.exports = { summarizeDocument, extractKeyClauses, askQuestion, chatWithAI, analyzeCase };

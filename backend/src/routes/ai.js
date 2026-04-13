const router = require('express').Router();
const { summarizeDocument, extractKeyClauses, askQuestion, chatWithAI, analyzeCase } = require('../controllers/aiController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'lawyer'));

router.post('/summarize/:document_id', summarizeDocument);
router.post('/clauses/:document_id', extractKeyClauses);
router.post('/ask/:document_id', askQuestion);
router.post('/chat', chatWithAI);
router.post('/analyze-case/:case_id', analyzeCase);

module.exports = router;

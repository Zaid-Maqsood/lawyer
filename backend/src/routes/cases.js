const router = require('express').Router();
const { getCases, getCaseById, createCase, updateCase, deleteCase, addTimelineEvent } = require('../controllers/caseController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getCases);
router.post('/', authorize('admin', 'lawyer'), createCase);
router.get('/:id', getCaseById);
router.put('/:id', authorize('admin', 'lawyer'), updateCase);
router.delete('/:id', authorize('admin'), deleteCase);
router.post('/:id/timeline', authorize('admin', 'lawyer'), addTimelineEvent);

module.exports = router;

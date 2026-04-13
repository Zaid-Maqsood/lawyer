const router = require('express').Router();
const { getTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog } = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getTimeLogs);
router.post('/', authorize('admin', 'lawyer'), createTimeLog);
router.put('/:id', authorize('admin', 'lawyer'), updateTimeLog);
router.delete('/:id', authorize('admin', 'lawyer'), deleteTimeLog);

module.exports = router;

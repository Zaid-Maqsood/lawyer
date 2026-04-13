const router = require('express').Router();
const { getTimeLogs, createTimeLog, updateTimeLog, deleteTimeLog, getInvoices, createInvoice, updateInvoiceStatus, getInvoiceById } = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/timelogs', getTimeLogs);
router.post('/timelogs', authorize('admin', 'lawyer'), createTimeLog);
router.put('/timelogs/:id', authorize('admin', 'lawyer'), updateTimeLog);
router.delete('/timelogs/:id', authorize('admin', 'lawyer'), deleteTimeLog);

router.get('/invoices', getInvoices);
router.post('/invoices', authorize('admin', 'lawyer'), createInvoice);
router.get('/invoices/:id', getInvoiceById);
router.put('/invoices/:id/status', authorize('admin', 'lawyer'), updateInvoiceStatus);

module.exports = router;

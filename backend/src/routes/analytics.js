const router = require('express').Router();
const { getDashboardStats, getCaseAnalytics, getBillingAnalytics } = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/dashboard', getDashboardStats);
router.get('/cases', authorize('admin', 'lawyer'), getCaseAnalytics);
router.get('/billing', authorize('admin'), getBillingAnalytics);

module.exports = router;

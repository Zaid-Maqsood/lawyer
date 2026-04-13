const router = require('express').Router();
const { globalSearch } = require('../controllers/searchController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', globalSearch);

module.exports = router;

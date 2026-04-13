const router = require('express').Router();
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getMessages);
router.post('/', sendMessage);
router.get('/unread', getUnreadCount);

module.exports = router;

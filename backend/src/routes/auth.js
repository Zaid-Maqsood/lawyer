const router = require('express').Router();
const { register, login, getMe, updateProfile, changePassword, getAllUsers } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, changePassword);
router.get('/users', authenticate, authorize('admin'), getAllUsers);

module.exports = router;

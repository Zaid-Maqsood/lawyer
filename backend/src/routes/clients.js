const router = require('express').Router();
const { getClients, getClientById, createClient, updateClient, deleteClient } = require('../controllers/clientController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'lawyer'));

router.get('/', getClients);
router.post('/', createClient);
router.get('/:id', getClientById);
router.put('/:id', updateClient);
router.delete('/:id', authorize('admin'), deleteClient);

module.exports = router;

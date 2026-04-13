const router = require('express').Router();
const { getTemplates, createTemplate, getTemplateById, fillTemplate, updateTemplate, deleteTemplate } = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getTemplates);
router.post('/', authorize('admin', 'lawyer'), createTemplate);
router.get('/:id', getTemplateById);
router.post('/:id/fill', fillTemplate);
router.put('/:id', authorize('admin', 'lawyer'), updateTemplate);
router.delete('/:id', authorize('admin'), deleteTemplate);

module.exports = router;

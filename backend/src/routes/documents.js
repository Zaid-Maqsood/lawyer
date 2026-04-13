const router = require('express').Router();
const { getDocuments, uploadDocument, getDocumentById, downloadDocument, deleteDocument, updateDocument } = require('../controllers/documentController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentById);
router.get('/:id/download', downloadDocument);
router.put('/:id', authorize('admin', 'lawyer'), updateDocument);
router.delete('/:id', authorize('admin', 'lawyer'), deleteDocument);

module.exports = router;

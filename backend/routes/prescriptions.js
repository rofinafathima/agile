const express = require('express');
const router = express.Router();
const prescriptions = require('../controllers/prescriptionController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.use(authenticate);
router.post('/', upload.single('prescription'), prescriptions.upload);
router.get('/', prescriptions.getAll);
router.get('/:id', prescriptions.getById);

module.exports = router;

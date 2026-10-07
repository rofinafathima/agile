const express = require('express');
const router = express.Router();
const medicines = require('../controllers/medicineController');

router.get('/', medicines.getAll);
router.get('/search', medicines.search);
router.get('/brands', medicines.getBrands);
router.get('/manufacturers', medicines.getManufacturers);
router.get('/:id', medicines.getById);

module.exports = router;

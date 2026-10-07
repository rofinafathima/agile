const express = require('express');
const router = express.Router();
const categories = require('../controllers/categoryController');

router.get('/', categories.getCategories);
router.get('/:slug', categories.getCategoryBySlug);

module.exports = router;

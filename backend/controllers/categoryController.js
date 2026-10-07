const { getDb } = require('../config/database');

exports.getCategories = (req, res) => {
  try {
    const db = getDb();
    const categories = db.prepare(`
      SELECT c.*, COUNT(m.id) as medicine_count
      FROM categories c
      LEFT JOIN medicines m ON c.id = m.category_id AND m.is_active = 1
      WHERE c.is_active = 1
      GROUP BY c.id
      ORDER BY c.name
    `).all();
    res.json({ categories });
  } catch (err) {
    console.error('Get categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

exports.getCategoryBySlug = (req, res) => {
  try {
    const db = getDb();
    const category = db.prepare('SELECT * FROM categories WHERE slug = ? AND is_active = 1').get(req.params.slug);
    if (!category) return res.status(404).json({ error: 'Category not found.' });
    res.json({ category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch category.' });
  }
};

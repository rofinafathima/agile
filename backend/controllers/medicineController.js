const { getDb } = require('../config/database');

exports.getAll = (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 20, category, search, sort, prescription, available, min_price, max_price, brand, manufacturer } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ['m.is_active = 1'];
    let params = [];

    if (category) {
      where.push('c.slug = ?');
      params.push(category);
    }
    if (search) {
      where.push('(m.name LIKE ? OR m.generic_name LIKE ? OR m.brand LIKE ? OR m.manufacturer LIKE ? OR m.composition LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (prescription === 'true') {
      where.push('m.prescription_required = 1');
    } else if (prescription === 'false') {
      where.push('m.prescription_required = 0');
    }
    if (available === 'true') {
      where.push('i.stock_quantity > 0');
    }
    if (min_price) {
      where.push('m.unit_price >= ?');
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      where.push('m.unit_price <= ?');
      params.push(parseFloat(max_price));
    }
    if (brand) {
      where.push('m.brand = ?');
      params.push(brand);
    }
    if (manufacturer) {
      where.push('m.manufacturer = ?');
      params.push(manufacturer);
    }

    let orderBy = 'm.name ASC';
    if (sort === 'price_low') orderBy = 'm.unit_price ASC';
    else if (sort === 'price_high') orderBy = 'm.unit_price DESC';
    else if (sort === 'newest') orderBy = 'm.created_at DESC';
    else if (sort === 'name') orderBy = 'm.name ASC';
    else if (sort === 'discount') orderBy = 'm.discount DESC';

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      ${whereClause}
    `;
    const total = db.prepare(countQuery).get(...params).total;

    const query = `
      SELECT m.*, c.name as category_name, c.slug as category_slug,
             i.stock_quantity, i.low_stock_threshold
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const medicines = db.prepare(query).all(...params, parseInt(limit), offset);

    res.json({
      medicines,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error('Get medicines error:', err);
    res.status(500).json({ error: 'Failed to fetch medicines.' });
  }
};

exports.getById = (req, res) => {
  try {
    const db = getDb();
    const medicine = db.prepare(`
      SELECT m.*, c.name as category_name, c.slug as category_slug,
             i.stock_quantity, i.low_stock_threshold
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE m.id = ? AND m.is_active = 1
    `).get(req.params.id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found.' });
    }

    // Get reviews
    const reviews = db.prepare(`
      SELECT r.*, u.name as user_name FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.medicine_id = ?
      ORDER BY r.created_at DESC LIMIT 10
    `).all(req.params.id);

    const avgRating = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews FROM reviews WHERE medicine_id = ?
    `).get(req.params.id);

    res.json({ medicine, reviews, avgRating: avgRating.avg_rating || 0, totalReviews: avgRating.total_reviews });
  } catch (err) {
    console.error('Get medicine error:', err);
    res.status(500).json({ error: 'Failed to fetch medicine details.' });
  }
};

exports.search = (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [], medicines: [] });
    }
    const db = getDb();
    const searchTerm = `%${q}%`;

    // Get suggestions (distinct names/generics)
    const suggestions = db.prepare(`
      SELECT DISTINCT name, generic_name, brand FROM medicines
      WHERE is_active = 1 AND (name LIKE ? OR generic_name LIKE ? OR brand LIKE ? OR composition LIKE ?)
      LIMIT 8
    `).all(searchTerm, searchTerm, searchTerm, searchTerm);

    // Get matching medicines
    const medicines = db.prepare(`
      SELECT m.*, c.name as category_name, i.stock_quantity, i.low_stock_threshold
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE m.is_active = 1 AND (m.name LIKE ? OR m.generic_name LIKE ? OR m.brand LIKE ? OR m.manufacturer LIKE ? OR m.composition LIKE ?)
      ORDER BY
        CASE WHEN m.name LIKE ? THEN 1
             WHEN m.generic_name LIKE ? THEN 2
             WHEN m.brand LIKE ? THEN 3
             ELSE 4 END,
        m.name ASC
      LIMIT 20
    `).all(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, `${q}%`, `${q}%`, `${q}%`);

    res.json({ suggestions, medicines });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed.' });
  }
};

exports.getBrands = (req, res) => {
  try {
    const db = getDb();
    const brands = db.prepare("SELECT DISTINCT brand FROM medicines WHERE is_active = 1 AND brand IS NOT NULL AND brand != '' ORDER BY brand").all();
    res.json({ brands: brands.map(b => b.brand) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch brands.' });
  }
};

exports.getManufacturers = (req, res) => {
  try {
    const db = getDb();
    const manufacturers = db.prepare("SELECT DISTINCT manufacturer FROM medicines WHERE is_active = 1 AND manufacturer IS NOT NULL ORDER BY manufacturer").all();
    res.json({ manufacturers: manufacturers.map(m => m.manufacturer) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch manufacturers.' });
  }
};

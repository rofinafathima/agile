const { getDb } = require('../config/database');
const { validateAddress } = require('../utils/validators');

exports.getAddresses = (req, res) => {
  try {
    const db = getDb();
    const addresses = db.prepare('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC').all(req.user.id);
    res.json({ addresses });
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ error: 'Failed to fetch addresses.' });
  }
};

exports.addAddress = (req, res) => {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
    const errors = validateAddress({ full_name, phone, address_line1, city, state, pincode });
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    const db = getDb();

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    const result = db.prepare(`
      INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, label || 'Home', full_name, phone, address_line1, address_line2 || '', city, state, pincode, is_default ? 1 : 0);

    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Address added successfully.', address });
  } catch (err) {
    console.error('Add address error:', err);
    res.status(500).json({ error: 'Failed to add address.' });
  }
};

exports.updateAddress = (req, res) => {
  try {
    const { label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!existing) return res.status(404).json({ error: 'Address not found.' });

    if (is_default) {
      db.prepare('UPDATE addresses SET is_default = 0 WHERE user_id = ?').run(req.user.id);
    }

    db.prepare(`
      UPDATE addresses SET label = ?, full_name = ?, phone = ?, address_line1 = ?, address_line2 = ?,
      city = ?, state = ?, pincode = ?, is_default = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).run(label || 'Home', full_name, phone, address_line1, address_line2 || '', city, state, pincode, is_default ? 1 : 0, req.params.id, req.user.id);

    const address = db.prepare('SELECT * FROM addresses WHERE id = ?').get(req.params.id);
    res.json({ message: 'Address updated.', address });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ error: 'Failed to update address.' });
  }
};

exports.deleteAddress = (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('DELETE FROM addresses WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Address not found.' });
    res.json({ message: 'Address deleted.' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ error: 'Failed to delete address.' });
  }
};

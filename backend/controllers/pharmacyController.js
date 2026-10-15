const { getDb } = require('../config/database');

// ─── Public: list all active pharmacies ───────────────────────────────────────
exports.getPharmacies = (req, res) => {
  try {
    const db = getDb();
    const { city, pincode } = req.query;
    let query = `SELECT id, name, code, phone, email, address, city, state, pincode, license_number, rating FROM pharmacies WHERE is_active = 1`;
    const params = [];
    if (city) { query += ` AND city LIKE ?`; params.push(`%${city}%`); }
    if (pincode) { query += ` AND pincode = ?`; params.push(pincode); }
    query += ` ORDER BY rating DESC`;
    const pharmacies = db.prepare(query).all(...params);
    res.json({ pharmacies });
  } catch (err) {
    console.error('Get pharmacies error:', err);
    res.status(500).json({ error: 'Failed to fetch pharmacies.' });
  }
};

// ─── Admin: assign pharmacy to an order ────────────────────────────────────────
exports.assignPharmacy = (req, res) => {
  try {
    const { order_id, pharmacy_id } = req.body;
    if (!order_id || !pharmacy_id) {
      return res.status(400).json({ error: 'order_id and pharmacy_id are required.' });
    }
    const db = getDb();
    const order = db.prepare('SELECT id, order_status FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    const pharmacy = db.prepare('SELECT id, name FROM pharmacies WHERE id = ? AND is_active = 1').get(pharmacy_id);
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy not found.' });

    db.prepare(`UPDATE orders SET pharmacy_id = ?, updated_at = datetime('now') WHERE id = ?`).run(pharmacy_id, order_id);
    db.prepare(`INSERT INTO order_status_history (order_id, status, description, updated_by) VALUES (?, ?, ?, ?)`)
      .run(order_id, order.order_status, `Order assigned to ${pharmacy.name}`, req.user.id);

    res.json({ message: `Order assigned to ${pharmacy.name} successfully.` });
  } catch (err) {
    console.error('Assign pharmacy error:', err);
    res.status(500).json({ error: 'Failed to assign pharmacy.' });
  }
};

// ─── Admin: auto-assign nearest pharmacy ───────────────────────────────────────
exports.autoAssignPharmacy = (req, res) => {
  try {
    const { order_id } = req.body;
    if (!order_id) return res.status(400).json({ error: 'order_id is required.' });
    const db = getDb();
    const order = db.prepare('SELECT id, order_status FROM orders WHERE id = ?').get(order_id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const pharmacy = db.prepare('SELECT id, name FROM pharmacies WHERE is_active = 1 ORDER BY rating DESC LIMIT 1').get();
    if (!pharmacy) return res.status(404).json({ error: 'No active pharmacy available.' });

    db.prepare(`UPDATE orders SET pharmacy_id = ?, updated_at = datetime('now') WHERE id = ?`).run(pharmacy.id, order_id);
    db.prepare(`INSERT INTO order_status_history (order_id, status, description, updated_by) VALUES (?, ?, ?, ?)`)
      .run(order_id, order.order_status, `Auto-assigned to ${pharmacy.name}`, req.user.id);

    res.json({ message: `Order auto-assigned to ${pharmacy.name}.`, pharmacy });
  } catch (err) {
    console.error('Auto-assign pharmacy error:', err);
    res.status(500).json({ error: 'Failed to auto-assign pharmacy.' });
  }
};

// ─── Pharmacy Portal: get own pharmacy profile ─────────────────────────────────
exports.getMyPharmacy = (req, res) => {
  try {
    const db = getDb();
    const pharmacy = db.prepare('SELECT * FROM pharmacies WHERE user_id = ?').get(req.user.id);
    if (!pharmacy) return res.status(404).json({ error: 'Pharmacy profile not found.' });
    res.json({ pharmacy });
  } catch (err) {
    console.error('Get my pharmacy error:', err);
    res.status(500).json({ error: 'Failed to fetch pharmacy profile.' });
  }
};

// ─── Pharmacy Portal: get orders assigned to this pharmacy ─────────────────────
exports.getMyOrders = (req, res) => {
  try {
    const db = getDb();
    const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
    if (!pharmacy) return res.status(403).json({ error: 'Pharmacy not found.' });

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE o.pharmacy_id = ?';
    const params = [pharmacy.id];
    if (status) { where += ` AND o.order_status = ?`; params.push(status); }

    const orders = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ${where}
      ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const getItems = db.prepare(`
      SELECT oi.*, m.image_url FROM order_items oi
      LEFT JOIN medicines m ON oi.medicine_id = m.id
      WHERE oi.order_id = ?
    `);

    const ordersWithItems = orders.map(o => ({
      ...o,
      delivery_address: (() => { try { return JSON.parse(o.delivery_address_snapshot); } catch { return {}; } })(),
      items: getItems.all(o.id),
    }));

    const countParams = [pharmacy.id];
    if (status) countParams.push(status);
    const total = db.prepare(`SELECT COUNT(*) as c FROM orders ${where}`).get(...countParams).c;

    res.json({ orders: ordersWithItems, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (err) {
    console.error('Get pharmacy orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

// ─── Pharmacy Portal: get single order detail ─────────────────────────────────
exports.getMyOrderById = (req, res) => {
  try {
    const db = getDb();
    const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
    if (!pharmacy) return res.status(403).json({ error: 'Pharmacy not found.' });

    const order = db.prepare(`
      SELECT o.*, u.name as customer_name, u.phone as customer_phone, u.email as customer_email
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.pharmacy_id = ?
    `).get(req.params.id, pharmacy.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare(`
      SELECT oi.*, m.image_url FROM order_items oi
      LEFT JOIN medicines m ON oi.medicine_id = m.id WHERE oi.order_id = ?
    `).all(order.id);

    const history = db.prepare(`
      SELECT osh.*, u.name as updated_by_name FROM order_status_history osh
      LEFT JOIN users u ON osh.updated_by = u.id WHERE osh.order_id = ? ORDER BY osh.created_at ASC
    `).all(order.id);

    res.json({
      order: {
        ...order,
        delivery_address: (() => { try { return JSON.parse(order.delivery_address_snapshot); } catch { return {}; } })(),
        items,
        history,
      }
    });
  } catch (err) {
    console.error('Get pharmacy order by id error:', err);
    res.status(500).json({ error: 'Failed to fetch order.' });
  }
};

// ─── Pharmacy Portal: update order status ──────────────────────────────────────
exports.updateOrderStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, description } = req.body;
    const db = getDb();

    const pharmacy = db.prepare('SELECT id FROM pharmacies WHERE user_id = ?').get(req.user.id);
    if (!pharmacy) return res.status(403).json({ error: 'Pharmacy not found.' });

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND pharmacy_id = ?').get(id, pharmacy.id);
    if (!order) return res.status(404).json({ error: 'Order not found or not assigned to your pharmacy.' });

    const allowed = ['confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${allowed.join(', ')}` });
    }

    db.prepare(`UPDATE orders SET order_status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id);
    db.prepare(`INSERT INTO order_status_history (order_id, status, description, updated_by) VALUES (?, ?, ?, ?)`)
      .run(id, status, description || `Status updated to ${status}`, req.user.id);

    const statusLabels = {
      confirmed: 'confirmed by pharmacy', preparing: 'being prepared', packed: 'packed and ready for dispatch',
      shipped: 'shipped', out_for_delivery: 'out for delivery', delivered: 'delivered',
    };
    db.prepare(`INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(order.user_id, `Order #${order.order_number} Update`,
        `Your order #${order.order_number} is now ${statusLabels[status] || status}.`,
        'order', 'order', order.id);

    res.json({ message: 'Order status updated.', status });
  } catch (err) {
    console.error('Update pharmacy order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// ─── Pharmacy Portal: dashboard stats ─────────────────────────────────────────
exports.getDashboard = (req, res) => {
  try {
    const db = getDb();
    const pharmacy = db.prepare('SELECT * FROM pharmacies WHERE user_id = ?').get(req.user.id);
    if (!pharmacy) return res.status(403).json({ error: 'Pharmacy not found.' });

    const pid = pharmacy.id;
    const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders WHERE pharmacy_id = ?').get(pid).c;
    const pendingOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE pharmacy_id = ? AND order_status IN ('placed','prescription_verification','confirmed','preparing','packed')`).get(pid).c;
    const outForDelivery = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE pharmacy_id = ? AND order_status = 'out_for_delivery'`).get(pid).c;
    const delivered = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE pharmacy_id = ? AND order_status = 'delivered'`).get(pid).c;
    const revenue = db.prepare(`SELECT COALESCE(SUM(total_amount),0) as r FROM orders WHERE pharmacy_id = ? AND order_status != 'cancelled'`).get(pid).r;
    const recentOrders = db.prepare(`
      SELECT o.id, o.order_number, o.order_status, o.total_amount, o.created_at, u.name as customer_name
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE o.pharmacy_id = ? ORDER BY o.created_at DESC LIMIT 5
    `).all(pid);
    const newOrders = db.prepare(`SELECT COUNT(*) as c FROM orders WHERE pharmacy_id = ? AND order_status = 'confirmed'`).get(pid).c;

    res.json({
      pharmacy,
      stats: { totalOrders, pendingOrders, outForDelivery, delivered, revenue, newOrders },
      recentOrders,
    });
  } catch (err) {
    console.error('Pharmacy dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
};

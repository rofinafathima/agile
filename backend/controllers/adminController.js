const { getDb } = require('../config/database');
const { validateMedicine } = require('../utils/validators');

// Dashboard
exports.getDashboard = (req, res) => {
  try {
    const db = getDb();

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'customer'").get().count;
    const totalMedicines = db.prepare('SELECT COUNT(*) as count FROM medicines WHERE is_active = 1').get().count;
    const lowStock = db.prepare('SELECT COUNT(*) as count FROM inventory i JOIN medicines m ON i.medicine_id = m.id WHERE i.stock_quantity <= i.low_stock_threshold AND i.stock_quantity > 0 AND m.is_active = 1').get().count;
    const outOfStock = db.prepare('SELECT COUNT(*) as count FROM inventory i JOIN medicines m ON i.medicine_id = m.id WHERE i.stock_quantity = 0 AND m.is_active = 1').get().count;
    const pendingPrescriptions = db.prepare("SELECT COUNT(*) as count FROM prescriptions WHERE status = 'pending'").get().count;

    const todaysOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE date(created_at) = date('now')").get().count;
    const pendingOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status IN ('placed', 'payment_confirmed', 'confirmed', 'preparing')").get().count;
    const completedOrders = db.prepare("SELECT COUNT(*) as count FROM orders WHERE order_status = 'delivered'").get().count;
    const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;

    const revenue = db.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE payment_status = 'paid'").get().total;
    const failedPayments = db.prepare("SELECT COUNT(*) as count FROM payments WHERE status = 'failed'").get().count;

    // Recent orders
    const recentOrders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC LIMIT 10
    `).all();

    // Daily orders (last 7 days)
    const dailyOrders = db.prepare(`
      SELECT date(created_at) as date, COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
      FROM orders WHERE created_at >= datetime('now', '-7 days')
      GROUP BY date(created_at) ORDER BY date ASC
    `).all();

    // Top medicines
    const topMedicines = db.prepare(`
      SELECT oi.medicine_name, SUM(oi.quantity) as total_sold, SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE o.order_status != 'cancelled'
      GROUP BY oi.medicine_id
      ORDER BY total_sold DESC LIMIT 10
    `).all();

    // Category-wise sales
    const categorySales = db.prepare(`
      SELECT c.name, COUNT(DISTINCT o.id) as order_count, COALESCE(SUM(oi.total_price), 0) as revenue
      FROM categories c
      LEFT JOIN medicines m ON c.id = m.category_id
      LEFT JOIN order_items oi ON m.id = oi.medicine_id
      LEFT JOIN orders o ON oi.order_id = o.id AND o.order_status != 'cancelled'
      WHERE c.is_active = 1
      GROUP BY c.id ORDER BY revenue DESC
    `).all();

    res.json({
      stats: {
        totalUsers, totalMedicines, lowStock, outOfStock,
        pendingPrescriptions, todaysOrders, pendingOrders, completedOrders, totalOrders,
        revenue: parseFloat(revenue.toFixed(2)), failedPayments,
      },
      recentOrders,
      dailyOrders,
      topMedicines,
      categorySales,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to load dashboard.' });
  }
};

// Medicine Management
exports.addMedicine = (req, res) => {
  try {
    const data = req.body;
    const errors = validateMedicine(data);
    if (errors.length > 0) return res.status(400).json({ error: errors[0], errors });

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO medicines (name, generic_name, brand, manufacturer, category_id, description, uses,
        composition, strength, dosage_form, pack_size, unit_type, unit_price, mrp, discount,
        prescription_required, individually_dispensable, min_order_quantity, max_order_quantity,
        storage_instructions, warnings, side_effects, dosage_info, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name, data.generic_name, data.brand, data.manufacturer, data.category_id || null,
      data.description, data.uses, data.composition, data.strength, data.dosage_form,
      data.pack_size || 1, data.unit_type || 'tablet', parseFloat(data.unit_price), parseFloat(data.mrp),
      parseFloat(data.discount || 0), data.prescription_required ? 1 : 0,
      data.individually_dispensable ? 1 : 0, data.min_order_quantity || 1, data.max_order_quantity || 100,
      data.storage_instructions, data.warnings, data.side_effects, data.dosage_info, data.image_url
    );

    // Create inventory record
    db.prepare('INSERT INTO inventory (medicine_id, stock_quantity, low_stock_threshold) VALUES (?, ?, ?)').run(
      result.lastInsertRowid, parseInt(data.stock_quantity || 0), parseInt(data.low_stock_threshold || 10)
    );

    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Medicine added successfully.', medicine });
  } catch (err) {
    console.error('Add medicine error:', err);
    res.status(500).json({ error: 'Failed to add medicine.' });
  }
};

exports.updateMedicine = (req, res) => {
  try {
    const data = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT id FROM medicines WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Medicine not found.' });

    db.prepare(`
      UPDATE medicines SET name = ?, generic_name = ?, brand = ?, manufacturer = ?, category_id = ?,
        description = ?, uses = ?, composition = ?, strength = ?, dosage_form = ?,
        pack_size = ?, unit_type = ?, unit_price = ?, mrp = ?, discount = ?,
        prescription_required = ?, individually_dispensable = ?, min_order_quantity = ?,
        max_order_quantity = ?, storage_instructions = ?, warnings = ?, side_effects = ?,
        dosage_info = ?, image_url = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      data.name, data.generic_name, data.brand, data.manufacturer, data.category_id || null,
      data.description, data.uses, data.composition, data.strength, data.dosage_form,
      data.pack_size || 1, data.unit_type || 'tablet', parseFloat(data.unit_price), parseFloat(data.mrp),
      parseFloat(data.discount || 0), data.prescription_required ? 1 : 0,
      data.individually_dispensable ? 1 : 0, data.min_order_quantity || 1, data.max_order_quantity || 100,
      data.storage_instructions, data.warnings, data.side_effects, data.dosage_info, data.image_url,
      req.params.id
    );

    const medicine = db.prepare('SELECT m.*, i.stock_quantity, i.low_stock_threshold FROM medicines m LEFT JOIN inventory i ON m.id = i.medicine_id WHERE m.id = ?').get(req.params.id);
    res.json({ message: 'Medicine updated.', medicine });
  } catch (err) {
    console.error('Update medicine error:', err);
    res.status(500).json({ error: 'Failed to update medicine.' });
  }
};

exports.deleteMedicine = (req, res) => {
  try {
    const db = getDb();
    // Soft delete
    db.prepare("UPDATE medicines SET is_active = 0, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ message: 'Medicine deactivated.' });
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ error: 'Failed to deactivate medicine.' });
  }
};

// Stock Management
exports.updateStock = (req, res) => {
  try {
    const { medicine_id, quantity, change_type, notes } = req.body;
    const db = getDb();

    const inv = db.prepare('SELECT * FROM inventory WHERE medicine_id = ?').get(medicine_id);
    if (!inv) return res.status(404).json({ error: 'Inventory record not found.' });

    let newQty = inv.stock_quantity;
    if (change_type === 'add') {
      newQty += parseInt(quantity);
    } else if (change_type === 'remove') {
      newQty = Math.max(0, newQty - parseInt(quantity));
    } else if (change_type === 'adjustment') {
      newQty = parseInt(quantity);
    } else {
      return res.status(400).json({ error: 'Invalid change type.' });
    }

    db.prepare("UPDATE inventory SET stock_quantity = ?, updated_at = datetime('now') WHERE medicine_id = ?").run(newQty, medicine_id);

    db.prepare(`
      INSERT INTO inventory_history (medicine_id, change_type, quantity_changed, previous_quantity, new_quantity, notes, admin_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(medicine_id, change_type, parseInt(quantity), inv.stock_quantity, newQty, notes || '', req.user.id);

    res.json({ message: 'Stock updated.', stock_quantity: newQty });
  } catch (err) {
    console.error('Update stock error:', err);
    res.status(500).json({ error: 'Failed to update stock.' });
  }
};

exports.getInventory = (req, res) => {
  try {
    const db = getDb();
    const { filter } = req.query;

    let where = 'm.is_active = 1';
    if (filter === 'low') where += ' AND i.stock_quantity <= i.low_stock_threshold AND i.stock_quantity > 0';
    else if (filter === 'out') where += ' AND i.stock_quantity = 0';

    const inventory = db.prepare(`
      SELECT m.id, m.name, m.generic_name, m.brand, m.strength, m.pack_size, m.unit_type,
             i.stock_quantity, i.low_stock_threshold, i.updated_at as last_updated
      FROM medicines m
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE ${where}
      ORDER BY i.stock_quantity ASC
    `).all();

    res.json({ inventory });
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ error: 'Failed to fetch inventory.' });
  }
};

exports.getStockHistory = (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare(`
      SELECT ih.*, m.name as medicine_name, u.name as admin_name
      FROM inventory_history ih
      JOIN medicines m ON ih.medicine_id = m.id
      LEFT JOIN users u ON ih.admin_id = u.id
      WHERE ih.medicine_id = ?
      ORDER BY ih.created_at DESC LIMIT 50
    `).all(req.params.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stock history.' });
  }
};

// Order Management
exports.getOrders = (req, res) => {
  try {
    const db = getDb();
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const params = [];
    if (status) {
      where += ' AND o.order_status = ?';
      params.push(status);
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM orders o WHERE ${where}`).get(...params).count;
    const orders = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o JOIN users u ON o.user_id = u.id
      WHERE ${where}
      ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), offset);

    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(o => ({ ...o, items: getItems.all(o.id) }));

    res.json({ orders: ordersWithItems, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error('Admin get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

exports.updateOrderStatus = (req, res) => {
  try {
    const { status, description } = req.body;
    const db = getDb();

    const validStatuses = ['placed', 'payment_confirmed', 'prescription_verification', 'confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const updateTx = db.transaction(() => {
      db.prepare("UPDATE orders SET order_status = ?, updated_at = datetime('now') WHERE id = ?").run(status, order.id);

      db.prepare(`
        INSERT INTO order_status_history (order_id, status, description, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(order.id, status, description || `Status updated to ${status.replace(/_/g, ' ')}`, req.user.id);

      // Notification to user
      const statusLabels = {
        confirmed: 'Order Confirmed',
        preparing: 'Order Being Prepared',
        packed: 'Order Packed',
        shipped: 'Order Shipped',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Order Delivered',
        cancelled: 'Order Cancelled',
      };

      if (statusLabels[status]) {
        db.prepare(`
          INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(order.user_id, statusLabels[status], `Your order #${order.order_number} is now ${status.replace(/_/g, ' ')}.`, 'order', 'order', order.id);
      }

      // If cancelled by admin, restore stock
      if (status === 'cancelled') {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        for (const item of items) {
          const inv = db.prepare('SELECT stock_quantity FROM inventory WHERE medicine_id = ?').get(item.medicine_id);
          db.prepare("UPDATE inventory SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE medicine_id = ?").run(item.quantity, item.medicine_id);
          db.prepare(`
            INSERT INTO inventory_history (medicine_id, change_type, quantity_changed, previous_quantity, new_quantity, notes, admin_id)
            VALUES (?, 'order_cancel_restore', ?, ?, ?, ?, ?)
          `).run(item.medicine_id, item.quantity, inv ? inv.stock_quantity : 0, (inv ? inv.stock_quantity : 0) + item.quantity, `Order ${order.order_number} cancelled by admin`, req.user.id);
        }
        db.prepare("UPDATE orders SET payment_status = 'refunded' WHERE id = ?").run(order.id);
      }
    });

    updateTx();
    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
    res.json({ message: 'Order status updated.', order: updatedOrder });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
};

// Prescription Management
exports.getPrescriptions = (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let where = '1=1';
    const params = [];
    if (status) {
      where += ' AND p.status = ?';
      params.push(status);
    }

    const prescriptions = db.prepare(`
      SELECT p.*, u.name as user_name, u.email as user_email
      FROM prescriptions p JOIN users u ON p.user_id = u.id
      WHERE ${where}
      ORDER BY p.created_at DESC
    `).all(...params);

    res.json({ prescriptions });
  } catch (err) {
    console.error('Admin get prescriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch prescriptions.' });
  }
};

exports.updatePrescription = (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    const db = getDb();

    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(req.params.id);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found.' });

    db.prepare(`
      UPDATE prescriptions SET status = ?, admin_notes = ?, reviewed_by = ?, reviewed_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ?
    `).run(status, admin_notes || null, req.user.id, req.params.id);

    // Notification to user
    const statusMessages = {
      approved: 'Your prescription has been approved.',
      rejected: 'Your prescription has been rejected. ' + (admin_notes ? `Reason: ${admin_notes}` : ''),
      clarification: 'Your prescription needs clarification. ' + (admin_notes ? `Note: ${admin_notes}` : ''),
    };

    if (statusMessages[status]) {
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(prescription.user_id, `Prescription ${status.charAt(0).toUpperCase() + status.slice(1)}`, statusMessages[status], 'prescription', 'prescription', prescription.id);

      // If approved, check and update any linked orders
      if (status === 'approved') {
        const linkedOrders = db.prepare("SELECT * FROM orders WHERE prescription_id = ? AND order_status = 'prescription_verification'").all(prescription.id);
        for (const order of linkedOrders) {
          db.prepare("UPDATE orders SET order_status = 'confirmed', updated_at = datetime('now') WHERE id = ?").run(order.id);
          db.prepare(`
            INSERT INTO order_status_history (order_id, status, description, updated_by)
            VALUES (?, 'confirmed', 'Prescription approved, order confirmed', ?)
          `).run(order.id, req.user.id);
        }
      }
    }

    res.json({ message: `Prescription ${status}.` });
  } catch (err) {
    console.error('Update prescription error:', err);
    res.status(500).json({ error: 'Failed to update prescription.' });
  }
};

// User Management
exports.getUsers = (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare(`
      SELECT id, name, email, phone, role, is_active, created_at,
        (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
      FROM users ORDER BY created_at DESC
    `).all();
    res.json({ users });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
};

exports.toggleUserStatus = (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ error: 'Cannot deactivate admin user.' });
    const newStatus = user.is_active ? 0 : 1;
    db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, req.params.id);
    res.json({ message: `User ${newStatus ? 'activated' : 'deactivated'}.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

// Payments
exports.getPayments = (req, res) => {
  try {
    const db = getDb();
    const payments = db.prepare(`
      SELECT p.*, o.order_number, u.name as user_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.user_id = u.id
      ORDER BY p.created_at DESC
    `).all();
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
};

// Categories Management
exports.addCategory = (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required.' });
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const db = getDb();
    const result = db.prepare('INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)').run(name, slug, description, icon);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Category added.', category });
  } catch (err) {
    console.error('Add category error:', err);
    res.status(500).json({ error: 'Failed to add category.' });
  }
};

exports.updateCategory = (req, res) => {
  try {
    const { name, description, icon, is_active } = req.body;
    const db = getDb();
    const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : undefined;
    db.prepare('UPDATE categories SET name = COALESCE(?, name), slug = COALESCE(?, slug), description = COALESCE(?, description), icon = COALESCE(?, icon), is_active = COALESCE(?, is_active) WHERE id = ?').run(name, slug, description, icon, is_active !== undefined ? (is_active ? 1 : 0) : undefined, req.params.id);
    const category = db.prepare('SELECT * FROM categories WHERE id = ?').get(req.params.id);
    res.json({ message: 'Category updated.', category });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category.' });
  }
};

exports.getAdminOrderById = (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare(`
      SELECT o.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?
    `).get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const statusHistory = db.prepare(`
      SELECT osh.*, u.name as updated_by_name FROM order_status_history osh
      LEFT JOIN users u ON osh.updated_by = u.id
      WHERE osh.order_id = ? ORDER BY osh.created_at ASC
    `).all(order.id);
    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(order.id);
    let prescription = null;
    if (order.prescription_id) {
      prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(order.prescription_id);
    }

    res.json({
      order: {
        ...order,
        items, statusHistory, payment, prescription,
        delivery_address: order.delivery_address_snapshot ? JSON.parse(order.delivery_address_snapshot) : null,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
};

// ─── Admin: list all pharmacies with stats ──────────────────────────────────
exports.getPharmacies = (req, res) => {
  try {
    const db = getDb();
    const pharmacies = db.prepare(`
      SELECT p.*,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.order_status != 'cancelled' THEN o.total_amount ELSE 0 END), 0) as total_revenue,
        COUNT(DISTINCT CASE WHEN o.order_status IN ('placed','confirmed','preparing','packed','shipped','out_for_delivery') THEN o.id END) as active_orders
      FROM pharmacies p
      LEFT JOIN orders o ON p.id = o.pharmacy_id
      GROUP BY p.id
      ORDER BY p.rating DESC
    `).all();
    res.json({ pharmacies });
  } catch (err) {
    console.error('Admin get pharmacies error:', err);
    res.status(500).json({ error: 'Failed to fetch pharmacies.' });
  }
};

// ─── Admin: toggle pharmacy active status ────────────────────────────────────
exports.addPharmacy = (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      pincode,
      phone,
      email,
      license_number,
      operating_hours,
    } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and code are required.' });
    const db = getDb();
    const existing = db.prepare('SELECT id FROM pharmacies WHERE code = ?').get(code);
    if (existing) return res.status(409).json({ error: 'Pharmacy with this code already exists.' });
    const result = db.prepare(`
      INSERT INTO pharmacies (
        name, code, address, city, state, pincode, phone, email, license_number, operating_hours, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).run(
      name,
      code,
      address || '',
      city || '',
      state || '',
      pincode || '',
      phone || '',
      email || '',
      license_number || '',
      operating_hours || ''
    );
    const pharmacy = db.prepare('SELECT * FROM pharmacies WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Pharmacy added successfully.', pharmacy });
  } catch (err) {
    console.error('Add pharmacy error:', err);
    res.status(500).json({ error: 'Failed to add pharmacy.' });
  }
};



const { getDb } = require('../config/database');
const { generateOrderNumber, calculateDeliveryDate } = require('../utils/helpers');

exports.createOrder = (req, res) => {
  try {
    const { address_id, prescription_id, payment_method, pharmacy_id } = req.body;
    const db = getDb();

    // Get cart items
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) return res.status(400).json({ error: 'Cart is empty.' });

    const cartItems = db.prepare(`
      SELECT ci.*, m.name, m.strength, m.unit_price, m.discount, m.prescription_required,
             m.individually_dispensable, m.pack_size, m.min_order_quantity, m.max_order_quantity,
             i.stock_quantity
      FROM cart_items ci
      JOIN medicines m ON ci.medicine_id = m.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE ci.cart_id = ?
    `).all(cart.id);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }

    // Validate address
    const address = db.prepare('SELECT * FROM addresses WHERE id = ? AND user_id = ?').get(address_id, req.user.id);
    if (!address) {
      return res.status(400).json({ error: 'Please select a valid delivery address.' });
    }

    // Validate stock and calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let hasPrescriptionItems = false;
    const orderItemsData = [];

    for (const item of cartItems) {
      // Stock check
      if (item.stock_quantity <= 0) {
        return res.status(400).json({ error: `${item.name} is out of stock. Please remove it from cart.` });
      }
      if (item.quantity > item.stock_quantity) {
        return res.status(400).json({ error: `Only ${item.stock_quantity} units of ${item.name} available.` });
      }

      // Quantity validation
      if (!item.individually_dispensable && item.quantity % item.pack_size !== 0) {
        return res.status(400).json({ error: `${item.name} must be ordered in packs of ${item.pack_size}.` });
      }

      if (item.prescription_required) {
        hasPrescriptionItems = true;
      }

      const discountedPrice = item.unit_price * (1 - (item.discount || 0) / 100);
      const itemTotal = discountedPrice * item.quantity;
      const originalTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
      totalDiscount += (originalTotal - itemTotal);

      orderItemsData.push({
        medicine_id: item.medicine_id,
        medicine_name: item.name,
        medicine_strength: item.strength,
        quantity: item.quantity,
        unit_price: parseFloat(discountedPrice.toFixed(2)),
        total_price: parseFloat(itemTotal.toFixed(2)),
        prescription_required: item.prescription_required,
      });
    }

    // Validate prescription if needed
    if (hasPrescriptionItems) {
      if (!prescription_id) {
        return res.status(400).json({ error: 'Prescription is required for some items in your cart. Please upload a prescription.' });
      }
      const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ? AND user_id = ?').get(prescription_id, req.user.id);
      if (!prescription) {
        return res.status(400).json({ error: 'Invalid prescription.' });
      }
    }

    const deliveryFee = subtotal >= 499 ? 0 : 49;
    const tax = parseFloat((subtotal * 0.05).toFixed(2));
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));
    const orderNumber = generateOrderNumber();
    const expectedDelivery = calculateDeliveryDate(5);

    // Snapshot address
    const addressSnapshot = JSON.stringify({
      full_name: address.full_name,
      phone: address.phone,
      address_line1: address.address_line1,
      address_line2: address.address_line2,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    });

    const initialStatus = hasPrescriptionItems ? 'prescription_verification' : 'placed';

    // Select or auto-assign nearest active pharmacy
    let pharmacy = null;
    if (pharmacy_id) {
      pharmacy = db.prepare('SELECT id, name, code, phone, email, address, city, state, pincode, rating FROM pharmacies WHERE id = ? AND is_active = 1').get(pharmacy_id);
    }
    if (!pharmacy) {
      // Auto-assign nearest / top-rated active pharmacy based on pincode or city
      pharmacy = db.prepare('SELECT id, name, code, phone, email, address, city, state, pincode, rating FROM pharmacies WHERE is_active = 1 AND pincode = ? ORDER BY rating DESC LIMIT 1').get(address.pincode);
      if (!pharmacy && address.city) {
        pharmacy = db.prepare('SELECT id, name, code, phone, email, address, city, state, pincode, rating FROM pharmacies WHERE is_active = 1 AND city LIKE ? ORDER BY rating DESC LIMIT 1').get(`%${address.city}%`);
      }
      if (!pharmacy) {
        pharmacy = db.prepare('SELECT id, name, code, phone, email, address, city, state, pincode, rating FROM pharmacies WHERE is_active = 1 ORDER BY rating DESC LIMIT 1').get();
      }
    }
    const assignedPharmacyId = pharmacy ? pharmacy.id : null;

    // Create order in transaction
    const createOrderTx = db.transaction(() => {
      const orderResult = db.prepare(`
        INSERT INTO orders (order_number, user_id, pharmacy_id, address_id, prescription_id, subtotal, discount_amount,
                           delivery_fee, tax, total_amount, payment_status, order_status, expected_delivery,
                           delivery_address_snapshot)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)
      `).run(orderNumber, req.user.id, assignedPharmacyId, address_id, prescription_id || null,
        parseFloat(subtotal.toFixed(2)), parseFloat(totalDiscount.toFixed(2)),
        deliveryFee, tax, total, initialStatus, expectedDelivery, addressSnapshot);

      const orderId = orderResult.lastInsertRowid;

      // Insert order items
      const insertOrderItem = db.prepare(`
        INSERT INTO order_items (order_id, medicine_id, medicine_name, medicine_strength, quantity, unit_price, total_price, prescription_required)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of orderItemsData) {
        insertOrderItem.run(orderId, item.medicine_id, item.medicine_name, item.medicine_strength,
          item.quantity, item.unit_price, item.total_price, item.prescription_required);
      }

      // Add status history
      const historyDesc = pharmacy ? `Order placed & assigned to ${pharmacy.name}` : 'Order placed successfully';
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, description, updated_by)
        VALUES (?, ?, ?, ?)
      `).run(orderId, initialStatus, historyDesc, req.user.id);

      // Create payment record
      db.prepare(`
        INSERT INTO payments (order_id, amount, status, payment_method)
        VALUES (?, ?, 'pending', ?)
      `).run(orderId, total, payment_method || 'online');

      // Deduct stock
      const updateStock = db.prepare(`UPDATE inventory SET stock_quantity = stock_quantity - ?, updated_at = datetime('now') WHERE medicine_id = ?`);
      const insertHistory = db.prepare(`
        INSERT INTO inventory_history (medicine_id, change_type, quantity_changed, previous_quantity, new_quantity, notes)
        VALUES (?, 'order_deduction', ?, ?, ?, ?)
      `);

      for (const item of cartItems) {
        updateStock.run(item.quantity, item.medicine_id);
        insertHistory.run(item.medicine_id, item.quantity, item.stock_quantity, item.stock_quantity - item.quantity, `Order ${orderNumber}`);
      }

      // Clear cart
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);

      // Create notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, 'Order Placed Successfully!', `Your order #${orderNumber} has been placed. Total: ₹${total.toFixed(2)}`, 'order', 'order', orderId);

      return orderId;
    });

    const orderId = createOrderTx();

    const order = db.prepare(`
      SELECT * FROM orders WHERE id = ?
    `).get(orderId);

    res.status(201).json({
      message: 'Order placed successfully!',
      order: {
        ...order,
        items: orderItemsData,
        expected_delivery: expectedDelivery,
        pharmacy,
      },
    });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ error: 'Failed to create order. Please try again.' });
  }
};

exports.getOrders = (req, res) => {
  try {
    const db = getDb();
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const total = db.prepare('SELECT COUNT(*) as count FROM orders WHERE user_id = ?').get(req.user.id).count;
    const orders = db.prepare(`
      SELECT o.*, p.name as pharmacy_name, p.city as pharmacy_city, p.phone as pharmacy_phone, p.rating as pharmacy_rating
      FROM orders o
      LEFT JOIN pharmacies p ON o.pharmacy_id = p.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC LIMIT ? OFFSET ?
    `).all(req.user.id, parseInt(limit), offset);

    // Get items for each order
    const getItems = db.prepare('SELECT * FROM order_items WHERE order_id = ?');
    const ordersWithItems = orders.map(order => ({
      ...order,
      items: getItems.all(order.id),
      delivery_address: order.delivery_address_snapshot ? JSON.parse(order.delivery_address_snapshot) : null,
    }));

    res.json({
      orders: ordersWithItems,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    console.error('Get orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
};

exports.getOrderById = (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
    const statusHistory = db.prepare('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC').all(order.id);
    const payment = db.prepare('SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1').get(order.id);

    let prescription = null;
    if (order.prescription_id) {
      prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(order.prescription_id);
    }

    let pharmacy = null;
    if (order.pharmacy_id) {
      pharmacy = db.prepare('SELECT id, name, code, phone, email, address, city, state, pincode, rating FROM pharmacies WHERE id = ?').get(order.pharmacy_id);
    }

    res.json({
      order: {
        ...order,
        items,
        statusHistory,
        payment,
        prescription,
        pharmacy,
        delivery_address: order.delivery_address_snapshot ? JSON.parse(order.delivery_address_snapshot) : null,
      },
    });
  } catch (err) {
    console.error('Get order error:', err);
    res.status(500).json({ error: 'Failed to fetch order details.' });
  }
};

exports.cancelOrder = (req, res) => {
  try {
    const { reason } = req.body;
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const cancellableStatuses = ['placed', 'payment_confirmed', 'prescription_verification', 'confirmed'];
    if (!cancellableStatuses.includes(order.order_status)) {
      return res.status(400).json({ error: `Order cannot be cancelled. Current status: ${order.order_status.replace(/_/g, ' ')}.` });
    }

    const cancelTx = db.transaction(() => {
      db.prepare(`
        UPDATE orders SET order_status = 'cancelled', payment_status = 'refunded',
        cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?
      `).run(reason || 'Cancelled by customer', order.id);

      db.prepare(`
        INSERT INTO order_status_history (order_id, status, description, updated_by)
        VALUES (?, 'cancelled', ?, ?)
      `).run(order.id, reason || 'Cancelled by customer', req.user.id);

      // Restore stock
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      for (const item of items) {
        const inv = db.prepare('SELECT stock_quantity FROM inventory WHERE medicine_id = ?').get(item.medicine_id);
        db.prepare(`UPDATE inventory SET stock_quantity = stock_quantity + ?, updated_at = datetime('now') WHERE medicine_id = ?`).run(item.quantity, item.medicine_id);
        db.prepare(`
          INSERT INTO inventory_history (medicine_id, change_type, quantity_changed, previous_quantity, new_quantity, notes)
          VALUES (?, 'order_cancel_restore', ?, ?, ?, ?)
        `).run(item.medicine_id, item.quantity, inv ? inv.stock_quantity : 0, (inv ? inv.stock_quantity : 0) + item.quantity, `Order ${order.order_number} cancelled`);
      }

      // Update payment
      db.prepare("UPDATE payments SET status = 'refunded', updated_at = datetime('now') WHERE order_id = ?").run(order.id);

      // Notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, 'Order Cancelled', `Your order #${order.order_number} has been cancelled. Refund will be processed.`, 'order', 'order', order.id);
    });

    cancelTx();
    res.json({ message: 'Order cancelled successfully. Refund will be processed.' });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ error: 'Failed to cancel order.' });
  }
};

exports.reorder = (req, res) => {
  try {
    const db = getDb();
    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    let cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    }

    let addedCount = 0;
    let errors = [];

    for (const item of items) {
      const medicine = db.prepare(`
        SELECT m.*, i.stock_quantity FROM medicines m
        LEFT JOIN inventory i ON m.id = i.medicine_id
        WHERE m.id = ? AND m.is_active = 1
      `).get(item.medicine_id);

      if (!medicine || medicine.stock_quantity <= 0) {
        errors.push(`${item.medicine_name} is currently unavailable.`);
        continue;
      }

      const qty = Math.min(item.quantity, medicine.stock_quantity);
      const existing = db.prepare('SELECT id FROM cart_items WHERE cart_id = ? AND medicine_id = ?').get(cart.id, item.medicine_id);

      if (!existing) {
        db.prepare('INSERT INTO cart_items (cart_id, medicine_id, quantity) VALUES (?, ?, ?)').run(cart.id, item.medicine_id, qty);
        addedCount++;
      }
    }

    res.json({
      message: `${addedCount} item(s) added to cart.`,
      warnings: errors,
    });
  } catch (err) {
    console.error('Reorder error:', err);
    res.status(500).json({ error: 'Failed to reorder.' });
  }
};

const { getDb } = require('../config/database');

exports.getCart = (req, res) => {
  try {
    const db = getDb();
    let cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT * FROM cart WHERE user_id = ?').get(req.user.id);
    }

    const items = db.prepare(`
      SELECT ci.*, m.name, m.generic_name, m.brand, m.strength, m.dosage_form,
             m.pack_size, m.unit_type, m.unit_price, m.mrp, m.discount,
             m.prescription_required, m.individually_dispensable, m.image_url,
             m.min_order_quantity, m.max_order_quantity, m.is_active,
             i.stock_quantity
      FROM cart_items ci
      JOIN medicines m ON ci.medicine_id = m.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE ci.cart_id = ?
      ORDER BY ci.created_at DESC
    `).all(cart.id);

    // Calculate totals
    let subtotal = 0;
    let totalDiscount = 0;
    let hasRxItems = false;
    const cartItems = items.map(item => {
      const unitPrice = item.unit_price * (1 - (item.discount || 0) / 100);
      const itemTotal = unitPrice * item.quantity;
      const originalTotal = item.unit_price * item.quantity;
      subtotal += itemTotal;
      totalDiscount += (originalTotal - itemTotal);
      if (item.prescription_required) hasRxItems = true;
      return {
        ...item,
        calculated_unit_price: parseFloat(unitPrice.toFixed(2)),
        item_total: parseFloat(itemTotal.toFixed(2)),
        original_total: parseFloat(originalTotal.toFixed(2)),
        in_stock: item.stock_quantity > 0 && item.stock_quantity >= item.quantity,
        is_available: item.is_active && item.stock_quantity > 0,
      };
    });

    const deliveryFee = subtotal >= 499 ? 0 : 49;
    const tax = parseFloat((subtotal * 0.05).toFixed(2)); // 5% GST
    const total = parseFloat((subtotal + deliveryFee + tax).toFixed(2));

    res.json({
      cart: {
        id: cart.id,
        items: cartItems,
        itemCount: cartItems.length,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(totalDiscount.toFixed(2)),
        deliveryFee,
        tax,
        total,
        hasPrescriptionItems: hasRxItems,
        freeDeliveryThreshold: 499,
      },
    });
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart.' });
  }
};

exports.addItem = (req, res) => {
  try {
    const { medicine_id, quantity = 1 } = req.body;
    const db = getDb();

    // Validate medicine exists
    const medicine = db.prepare(`
      SELECT m.*, i.stock_quantity FROM medicines m
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE m.id = ? AND m.is_active = 1
    `).get(medicine_id);

    if (!medicine) {
      return res.status(404).json({ error: 'Medicine not found or unavailable.' });
    }

    // Check stock
    if (medicine.stock_quantity <= 0) {
      return res.status(400).json({ error: 'This medicine is currently out of stock.' });
    }
    if (quantity > medicine.stock_quantity) {
      return res.status(400).json({ error: `Only ${medicine.stock_quantity} units available.` });
    }

    // Validate quantity
    const qty = parseInt(quantity);
    if (qty < medicine.min_order_quantity) {
      return res.status(400).json({ error: `Minimum order quantity is ${medicine.min_order_quantity}.` });
    }
    if (qty > medicine.max_order_quantity) {
      return res.status(400).json({ error: `Maximum order quantity is ${medicine.max_order_quantity}.` });
    }

    // Check individually dispensable
    if (!medicine.individually_dispensable && qty % medicine.pack_size !== 0) {
      return res.status(400).json({
        error: `This medicine must be ordered in packs of ${medicine.pack_size}. Please select a multiple of ${medicine.pack_size}.`,
      });
    }

    // Get or create cart
    let cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) {
      db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
      cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    }

    // Check if item already in cart
    const existingItem = db.prepare('SELECT * FROM cart_items WHERE cart_id = ? AND medicine_id = ?').get(cart.id, medicine_id);

    if (existingItem) {
      const newQty = existingItem.quantity + qty;
      if (newQty > medicine.stock_quantity) {
        return res.status(400).json({ error: `Cannot add more. Only ${medicine.stock_quantity} units available. You already have ${existingItem.quantity} in cart.` });
      }
      if (newQty > medicine.max_order_quantity) {
        return res.status(400).json({ error: `Maximum order quantity is ${medicine.max_order_quantity}.` });
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existingItem.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, medicine_id, quantity) VALUES (?, ?, ?)').run(cart.id, medicine_id, qty);
    }

    db.prepare("UPDATE cart SET updated_at = datetime('now') WHERE id = ?").run(cart.id);

    // Return updated cart count
    const count = db.prepare('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?').get(cart.id);

    res.json({ message: 'Added to cart successfully.', cartCount: count.count });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart.' });
  }
};

exports.updateItem = (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const db = getDb();

    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found.' });

    const item = db.prepare(`
      SELECT ci.*, m.pack_size, m.individually_dispensable, m.min_order_quantity, m.max_order_quantity,
             i.stock_quantity
      FROM cart_items ci
      JOIN medicines m ON ci.medicine_id = m.id
      LEFT JOIN inventory i ON m.id = i.medicine_id
      WHERE ci.id = ? AND ci.cart_id = ?
    `).get(id, cart.id);

    if (!item) return res.status(404).json({ error: 'Cart item not found.' });

    const qty = parseInt(quantity);
    if (qty <= 0) {
      db.prepare('DELETE FROM cart_items WHERE id = ?').run(id);
      return res.json({ message: 'Item removed from cart.' });
    }

    if (qty > item.stock_quantity) {
      return res.status(400).json({ error: `Only ${item.stock_quantity} units available.` });
    }
    if (!item.individually_dispensable && qty % item.pack_size !== 0) {
      return res.status(400).json({ error: `Must be ordered in packs of ${item.pack_size}.` });
    }
    if (qty < item.min_order_quantity) {
      return res.status(400).json({ error: `Minimum quantity is ${item.min_order_quantity}.` });
    }
    if (qty > item.max_order_quantity) {
      return res.status(400).json({ error: `Maximum quantity is ${item.max_order_quantity}.` });
    }

    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(qty, id);
    res.json({ message: 'Cart updated.' });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart.' });
  }
};

exports.removeItem = (req, res) => {
  try {
    const db = getDb();
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) return res.status(404).json({ error: 'Cart not found.' });

    db.prepare('DELETE FROM cart_items WHERE id = ? AND cart_id = ?').run(req.params.id, cart.id);
    res.json({ message: 'Item removed from cart.' });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ error: 'Failed to remove item.' });
  }
};

exports.clearCart = (req, res) => {
  try {
    const db = getDb();
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (cart) {
      db.prepare('DELETE FROM cart_items WHERE cart_id = ?').run(cart.id);
    }
    res.json({ message: 'Cart cleared.' });
  } catch (err) {
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart.' });
  }
};

exports.getCartCount = (req, res) => {
  try {
    const db = getDb();
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(req.user.id);
    if (!cart) return res.json({ count: 0 });
    const result = db.prepare('SELECT COUNT(*) as count FROM cart_items WHERE cart_id = ?').get(cart.id);
    res.json({ count: result.count });
  } catch (err) {
    res.json({ count: 0 });
  }
};

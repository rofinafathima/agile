const { getDb } = require('../config/database');

exports.createPayment = (req, res) => {
  try {
    const { order_id } = req.body;
    const db = getDb();

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid.' });
    }

    // Simulate payment gateway order creation
    const paymentOrderId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    db.prepare(`
      UPDATE payments SET payment_order_id = ?, status = 'processing', updated_at = datetime('now')
      WHERE order_id = ?
    `).run(paymentOrderId, order_id);

    res.json({
      payment: {
        order_id: order.id,
        payment_order_id: paymentOrderId,
        amount: order.total_amount,
        currency: 'INR',
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        description: `Payment for Order #${order.order_number}`,
        prefill: {
          name: req.user.name,
          email: req.user.email,
          contact: req.user.phone,
        },
      },
    });
  } catch (err) {
    console.error('Create payment error:', err);
    res.status(500).json({ error: 'Failed to initiate payment.' });
  }
};

exports.verifyPayment = (req, res) => {
  try {
    const { order_id, payment_id, payment_order_id, signature } = req.body;
    const db = getDb();

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    // In production, verify the payment signature with Razorpay server-side
    // For demo, we simulate verification
    const isValid = true; // In production: verify HMAC signature

    if (!isValid) {
      db.prepare("UPDATE payments SET status = 'failed', updated_at = datetime('now') WHERE order_id = ?").run(order_id);
      db.prepare("UPDATE orders SET payment_status = 'failed', updated_at = datetime('now') WHERE id = ?").run(order_id);

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, 'Payment Failed', `Payment for order #${order.order_number} failed. Please try again.`, 'payment', 'order', order.id);

      return res.status(400).json({ error: 'Payment verification failed.' });
    }

    const verifyTx = db.transaction(() => {
      // Update payment
      db.prepare(`
        UPDATE payments SET transaction_id = ?, status = 'successful', 
        payment_response = ?, updated_at = datetime('now') WHERE order_id = ?
      `).run(payment_id || paymentOrderId, JSON.stringify(req.body), order_id);

      // Update order
      const hasPrescriptionItems = order.order_status === 'prescription_verification';
      const newStatus = hasPrescriptionItems ? 'prescription_verification' : 'confirmed';

      db.prepare(`
        UPDATE orders SET payment_status = 'paid', order_status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(newStatus, order_id);

      // Status history
      db.prepare(`
        INSERT INTO order_status_history (order_id, status, description, updated_by)
        VALUES (?, 'payment_confirmed', 'Payment received successfully', ?)
      `).run(order_id, req.user.id);

      if (newStatus === 'confirmed') {
        db.prepare(`
          INSERT INTO order_status_history (order_id, status, description, updated_by)
          VALUES (?, 'confirmed', 'Order confirmed', ?)
        `).run(order_id, req.user.id);
      }

      // Notification
      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, 'Payment Successful!', `Payment for order #${order.order_number} has been confirmed. Amount: ₹${order.total_amount}`, 'payment', 'order', order.id);
    });

    verifyTx();
    res.json({ message: 'Payment verified successfully.', status: 'paid' });
  } catch (err) {
    console.error('Verify payment error:', err);
    res.status(500).json({ error: 'Payment verification error.' });
  }
};

exports.simulatePayment = (req, res) => {
  try {
    const { order_id } = req.body;
    const db = getDb();

    const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(order_id, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Order is already paid.' });
    }

    const txId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const payTx = db.transaction(() => {
      db.prepare(`
        UPDATE payments SET transaction_id = ?, status = 'successful', payment_method = 'demo_payment',
        updated_at = datetime('now') WHERE order_id = ?
      `).run(txId, order_id);

      const hasPrescription = order.order_status === 'prescription_verification';
      const newStatus = hasPrescription ? 'prescription_verification' : 'confirmed';

      db.prepare(`
        UPDATE orders SET payment_status = 'paid', order_status = ?, updated_at = datetime('now') WHERE id = ?
      `).run(newStatus, order_id);

      db.prepare(`
        INSERT INTO order_status_history (order_id, status, description, updated_by)
        VALUES (?, 'payment_confirmed', 'Payment confirmed (Demo)', ?)
      `).run(order_id, req.user.id);

      if (newStatus === 'confirmed') {
        db.prepare(`
          INSERT INTO order_status_history (order_id, status, description, updated_by)
          VALUES (?, 'confirmed', 'Order confirmed', ?)
        `).run(order_id, req.user.id);
      }

      db.prepare(`
        INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(req.user.id, 'Payment Successful!', `Payment for order #${order.order_number} confirmed. Amount: ₹${order.total_amount}`, 'payment', 'order', order.id);
    });

    payTx();

    const updatedOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(order_id);
    res.json({ message: 'Payment successful!', order: updatedOrder, transaction_id: txId });
  } catch (err) {
    console.error('Simulate payment error:', err);
    res.status(500).json({ error: 'Payment failed.' });
  }
};

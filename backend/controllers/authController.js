const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../config/database');
const { validateSignup, validateLogin } = require('../utils/validators');

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

exports.register = (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, date_of_birth } = req.body;
    const errors = validateSignup({ name, email, phone, password, confirmPassword });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], errors });
    }
    const db = getDb();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone);
    if (existingPhone) {
      return res.status(409).json({ error: 'An account with this phone number already exists.' });
    }
    const password_hash = bcrypt.hashSync(password, 12);
    const result = db.prepare(`
      INSERT INTO users (name, email, phone, password_hash, date_of_birth, role)
      VALUES (?, ?, ?, ?, ?, 'customer')
    `).run(name.trim(), email.toLowerCase().trim(), phone.trim(), password_hash, date_of_birth || null);

    // Create cart for user
    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(result.lastInsertRowid);

    const token = generateToken(result.lastInsertRowid);
    const user = db.prepare('SELECT id, name, email, phone, role, date_of_birth, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type) 
      VALUES (?, ?, ?, ?)
    `).run(result.lastInsertRowid, 'Welcome to E-Pharmacy!', 'Your account has been created successfully. Start browsing medicines now.', 'success');

    res.status(201).json({ message: 'Account created successfully.', token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'An error occurred during registration. Please try again.' });
  }
};

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;
    const errors = validateLogin({ email, password });
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], errors });
    }
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact support.' });
    }
    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Ensure cart exists
    const cart = db.prepare('SELECT id FROM cart WHERE user_id = ?').get(user.id);
    if (!cart) {
      db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(user.id);
    }

    const token = generateToken(user.id);
    const { password_hash, ...safeUser } = user;
    res.json({ message: 'Login successful.', token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An error occurred during login. Please try again.' });
  }
};

exports.getProfile = (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare(`
      SELECT id, name, email, phone, date_of_birth, role, avatar_url, created_at, updated_at
      FROM users WHERE id = ?
    `).get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

exports.updateProfile = (req, res) => {
  try {
    const { name, phone, date_of_birth } = req.body;
    const db = getDb();
    db.prepare(`
      UPDATE users SET name = ?, phone = ?, date_of_birth = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, phone, date_of_birth, req.user.id);
    const user = db.prepare('SELECT id, name, email, phone, date_of_birth, role, created_at FROM users WHERE id = ?').get(req.user.id);
    res.json({ message: 'Profile updated successfully.', user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
};

exports.changePassword = (req, res) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }
    const db = getDb();
    const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }
    const hash = bcrypt.hashSync(newPassword, 12);
    db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(hash, req.user.id);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password.' });
  }
};

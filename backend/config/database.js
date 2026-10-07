const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database', 'epharmacy.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeTables();
  }
  return db;
}

function initializeTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      date_of_birth TEXT,
      role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      avatar_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      icon TEXT,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      generic_name TEXT,
      brand TEXT,
      manufacturer TEXT,
      category_id INTEGER,
      description TEXT,
      uses TEXT,
      composition TEXT,
      strength TEXT,
      dosage_form TEXT,
      pack_size INTEGER DEFAULT 1,
      unit_type TEXT DEFAULT 'tablet',
      unit_price REAL NOT NULL,
      mrp REAL NOT NULL,
      discount REAL DEFAULT 0,
      prescription_required INTEGER DEFAULT 0,
      individually_dispensable INTEGER DEFAULT 1,
      min_order_quantity INTEGER DEFAULT 1,
      max_order_quantity INTEGER DEFAULT 100,
      storage_instructions TEXT,
      warnings TEXT,
      side_effects TEXT,
      drug_interactions TEXT,
      dosage_info TEXT,
      image_url TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER UNIQUE NOT NULL,
      stock_quantity INTEGER DEFAULT 0,
      low_stock_threshold INTEGER DEFAULT 10,
      last_restocked TEXT,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );

    CREATE TABLE IF NOT EXISTS inventory_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medicine_id INTEGER NOT NULL,
      change_type TEXT NOT NULL CHECK(change_type IN ('add', 'remove', 'adjustment', 'order_deduction', 'order_cancel_restore')),
      quantity_changed INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      notes TEXT,
      admin_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (admin_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      label TEXT DEFAULT 'Home',
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line1 TEXT NOT NULL,
      address_line2 TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      patient_name TEXT,
      doctor_name TEXT,
      prescription_date TEXT,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_name TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected', 'clarification')),
      admin_notes TEXT,
      reviewed_by INTEGER,
      reviewed_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (cart_id) REFERENCES cart(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      UNIQUE(cart_id, medicine_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      address_id INTEGER,
      prescription_id INTEGER,
      subtotal REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      delivery_fee REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
      order_status TEXT DEFAULT 'placed' CHECK(order_status IN ('placed', 'payment_confirmed', 'prescription_verification', 'confirmed', 'preparing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
      expected_delivery TEXT,
      delivery_address_snapshot TEXT,
      cancellation_reason TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (address_id) REFERENCES addresses(id),
      FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      medicine_name TEXT NOT NULL,
      medicine_strength TEXT,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      prescription_required INTEGER DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      payment_provider TEXT DEFAULT 'razorpay',
      payment_order_id TEXT,
      transaction_id TEXT,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'INR',
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'successful', 'failed', 'refunded')),
      payment_method TEXT,
      payment_response TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    CREATE TABLE IF NOT EXISTS order_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      updated_by INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error', 'order', 'prescription', 'payment')),
      is_read INTEGER DEFAULT 0,
      reference_type TEXT,
      reference_id INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      medicine_id INTEGER NOT NULL,
      order_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );

    -- Indexes for performance
    CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category_id);
    CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
    CREATE INDEX IF NOT EXISTS idx_medicines_generic ON medicines(generic_name);
    CREATE INDEX IF NOT EXISTS idx_inventory_medicine ON inventory(medicine_id);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_cart_items_cart ON cart_items(cart_id);
    CREATE INDEX IF NOT EXISTS idx_prescriptions_user ON prescriptions(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
  `);
}

module.exports = { getDb };

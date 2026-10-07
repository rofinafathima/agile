const { getDb } = require('../config/database');

exports.upload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a prescription file (JPG, PNG, or PDF).' });
    }

    const { patient_name, doctor_name, prescription_date, notes } = req.body;
    const db = getDb();

    const result = db.prepare(`
      INSERT INTO prescriptions (user_id, patient_name, doctor_name, prescription_date, file_url, file_type, file_name, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      patient_name || req.user.name,
      doctor_name || null,
      prescription_date || null,
      `/uploads/prescriptions/${req.file.filename}`,
      req.file.mimetype,
      req.file.originalname,
      notes || null
    );

    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(result.lastInsertRowid);

    // Notification
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type, reference_type, reference_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, 'Prescription Uploaded', 'Your prescription has been uploaded and is pending review.', 'prescription', 'prescription', prescription.id);

    res.status(201).json({ message: 'Prescription uploaded successfully.', prescription });
  } catch (err) {
    console.error('Upload prescription error:', err);
    res.status(500).json({ error: 'Failed to upload prescription.' });
  }
};

exports.getAll = (req, res) => {
  try {
    const db = getDb();
    const prescriptions = db.prepare(`
      SELECT * FROM prescriptions WHERE user_id = ? ORDER BY created_at DESC
    `).all(req.user.id);
    res.json({ prescriptions });
  } catch (err) {
    console.error('Get prescriptions error:', err);
    res.status(500).json({ error: 'Failed to fetch prescriptions.' });
  }
};

exports.getById = (req, res) => {
  try {
    const db = getDb();
    const prescription = db.prepare('SELECT * FROM prescriptions WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!prescription) return res.status(404).json({ error: 'Prescription not found.' });
    res.json({ prescription });
  } catch (err) {
    console.error('Get prescription error:', err);
    res.status(500).json({ error: 'Failed to fetch prescription.' });
  }
};

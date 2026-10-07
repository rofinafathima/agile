const { getDb } = require('../config/database');
const bcrypt = require('bcryptjs');

function seed() {
  const db = getDb();

  console.log('🌱 Seeding database...');

  // Clear existing data
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM reviews;
    DELETE FROM order_status_history;
    DELETE FROM payments;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM cart_items;
    DELETE FROM cart;
    DELETE FROM prescriptions;
    DELETE FROM addresses;
    DELETE FROM inventory_history;
    DELETE FROM inventory;
    DELETE FROM medicines;
    DELETE FROM categories;
    DELETE FROM users;
  `);

  // Seed admin user
  const adminHash = bcrypt.hashSync('Admin@123456', 12);
  const userHash = bcrypt.hashSync('User@123456', 12);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, phone, password_hash, date_of_birth, role) VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run('Admin User', 'admin@epharmacy.com', '9876543210', adminHash, '1990-01-15', 'admin');
  insertUser.run('Demo Customer', 'user@epharmacy.com', '9876543211', userHash, '1995-06-20', 'customer');
  insertUser.run('Rahul Sharma', 'rahul@example.com', '9876543212', userHash, '1992-03-10', 'customer');

  console.log('✅ Users seeded');

  // Seed categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (name, slug, description, icon) VALUES (?, ?, ?, ?)
  `);

  const categories = [
    ['Pain Relief', 'pain-relief', 'Medicines for pain management and relief', '💊'],
    ['Fever & Cold', 'fever-cold', 'Medicines for fever, cold, and flu symptoms', '🤒'],
    ['Diabetes', 'diabetes', 'Medicines for diabetes management', '💉'],
    ['Blood Pressure', 'blood-pressure', 'Medicines for blood pressure management', '❤️'],
    ['Vitamins & Supplements', 'vitamins-supplements', 'Vitamins, minerals, and dietary supplements', '🥗'],
    ['Digestive Health', 'digestive-health', 'Medicines for digestive issues', '🩺'],
    ['Skin Care', 'skin-care', 'Dermatological medicines and treatments', '🧴'],
    ['Baby Care', 'baby-care', 'Medicines and products for infants and children', '👶'],
    ['First Aid', 'first-aid', 'First aid supplies and wound care products', '🩹'],
    ['Women\'s Health', 'womens-health', 'Medicines and supplements for women\'s health', '🌸'],
    ['Men\'s Health', 'mens-health', 'Medicines and supplements for men\'s health', '💪'],
    ['Antibiotics', 'antibiotics', 'Antibiotic medicines (prescription required)', '🔬'],
    ['Eye & Ear Care', 'eye-ear-care', 'Ophthalmic and otic medicines', '👁️'],
    ['Respiratory', 'respiratory', 'Medicines for respiratory conditions', '🫁'],
    ['Heart Care', 'heart-care', 'Cardiovascular medicines', '🫀'],
  ];

  for (const cat of categories) {
    insertCategory.run(...cat);
  }

  console.log('✅ Categories seeded');

  // Seed medicines with realistic data
  const insertMedicine = db.prepare(`
    INSERT INTO medicines (
      name, generic_name, brand, manufacturer, category_id, description, uses,
      composition, strength, dosage_form, pack_size, unit_type, unit_price, mrp,
      discount, prescription_required, individually_dispensable, min_order_quantity,
      max_order_quantity, storage_instructions, warnings, side_effects, dosage_info, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertInventory = db.prepare(`
    INSERT INTO inventory (medicine_id, stock_quantity, low_stock_threshold) VALUES (?, ?, ?)
  `);

  const medicines = [
    // Pain Relief
    {
      name: 'Dolo 650', generic_name: 'Paracetamol', brand: 'Dolo', manufacturer: 'Micro Labs Ltd',
      category_id: 1, description: 'Dolo 650 contains Paracetamol as its active ingredient. It is commonly used for the temporary relief of mild to moderate pain and to reduce fever.',
      uses: 'Headache, Toothache, Body pain, Fever, Common cold symptoms',
      composition: 'Paracetamol 650mg', strength: '650mg', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 2.07, mrp: 31.09, discount: 5,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 150,
      storage: 'Store below 30°C. Protect from moisture and light.', 
      warnings: 'Do not exceed recommended dose. Consult doctor if symptoms persist beyond 3 days. Not recommended for patients with liver disease without medical advice.',
      side_effects: 'Nausea, Allergic reactions (rare), Skin rash (rare). Consult your doctor if you experience any adverse effects.',
      dosage_info: 'As directed by your physician. This information is for reference only.', 
      image_url: null, stock: 500, threshold: 50
    },
    {
      name: 'Crocin Advance', generic_name: 'Paracetamol', brand: 'Crocin', manufacturer: 'GlaxoSmithKline',
      category_id: 1, description: 'Crocin Advance contains Paracetamol 500mg. It is used for the relief of mild to moderate pain and fever.',
      uses: 'Headache, Migraine, Toothache, Period pain, Fever',
      composition: 'Paracetamol 500mg', strength: '500mg', dosage_form: 'Tablet', pack_size: 20,
      unit_type: 'tablet', unit_price: 1.50, mrp: 30.00, discount: 8,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 200,
      storage: 'Store below 25°C in a dry place.', 
      warnings: 'Do not take more than the recommended dose. Avoid with alcohol. Consult doctor if symptoms persist.',
      side_effects: 'Nausea, Allergic skin reactions (rare). Seek medical attention if adverse effects occur.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 800, threshold: 100
    },
    {
      name: 'Combiflam', generic_name: 'Ibuprofen + Paracetamol', brand: 'Combiflam', manufacturer: 'Sanofi India',
      category_id: 1, description: 'Combiflam contains a combination of Ibuprofen and Paracetamol. It is used for the relief of pain and inflammation.',
      uses: 'Body pain, Joint pain, Muscle pain, Headache, Dental pain, Fever with body ache',
      composition: 'Ibuprofen 400mg + Paracetamol 325mg', strength: '400mg/325mg', dosage_form: 'Tablet', pack_size: 20,
      unit_type: 'tablet', unit_price: 3.50, mrp: 70.00, discount: 10,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 100,
      storage: 'Store below 30°C. Protect from moisture.', 
      warnings: 'Not recommended for patients with gastric ulcers or bleeding disorders. Avoid with alcohol.',
      side_effects: 'Stomach pain, Nausea, Dizziness (uncommon). Consult your doctor if side effects persist.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 350, threshold: 40
    },
    {
      name: 'Voveran SR 100', generic_name: 'Diclofenac Sodium', brand: 'Voveran', manufacturer: 'Novartis India',
      category_id: 1, description: 'Voveran SR 100 contains Diclofenac Sodium, a non-steroidal anti-inflammatory drug (NSAID).',
      uses: 'Joint pain, Muscle pain, Back pain, Inflammation, Arthritis-related pain',
      composition: 'Diclofenac Sodium 100mg (Sustained Release)', strength: '100mg SR', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 5.20, mrp: 78.00, discount: 12,
      prescription_required: 1, individually_dispensable: 0, min_order: 15, max_order: 60,
      storage: 'Store below 30°C in a dry place.', 
      warnings: 'Prescription required. Not recommended for patients with kidney, liver, or heart conditions without medical advice. Avoid with blood thinners.',
      side_effects: 'Stomach upset, Nausea, Dizziness. Report unusual symptoms to your doctor immediately.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 200, threshold: 30
    },

    // Fever & Cold
    {
      name: 'Sinarest New', generic_name: 'Paracetamol + Phenylephrine + Chlorpheniramine', brand: 'Sinarest', manufacturer: 'Centaur Pharma',
      category_id: 2, description: 'Sinarest New is a combination medicine used for the symptomatic relief of common cold and flu.',
      uses: 'Common cold, Nasal congestion, Runny nose, Sneezing, Fever with cold',
      composition: 'Paracetamol 500mg + Phenylephrine 10mg + Chlorpheniramine 2mg', strength: '500mg/10mg/2mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 3.80, mrp: 38.00, discount: 5,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 50,
      storage: 'Store below 25°C. Protect from light.', 
      warnings: 'May cause drowsiness. Do not drive or operate machinery after taking. Not for children under 12 without medical advice.',
      side_effects: 'Drowsiness, Dry mouth, Dizziness. Consult doctor if symptoms worsen.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 450, threshold: 50
    },
    {
      name: 'Cetrizine 10mg', generic_name: 'Cetirizine Hydrochloride', brand: 'Okacet', manufacturer: 'Cipla Ltd',
      category_id: 2, description: 'Cetirizine is an antihistamine used to relieve allergy symptoms.',
      uses: 'Allergic rhinitis, Hay fever, Urticaria, Itchy eyes, Sneezing',
      composition: 'Cetirizine Hydrochloride 10mg', strength: '10mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 2.50, mrp: 25.00, discount: 10,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 60,
      storage: 'Store below 30°C.', 
      warnings: 'May cause drowsiness in some individuals. Avoid alcohol.',
      side_effects: 'Drowsiness, Dry mouth, Headache (uncommon).',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 600, threshold: 50
    },
    {
      name: 'Azithral 500', generic_name: 'Azithromycin', brand: 'Azithral', manufacturer: 'Alembic Pharma',
      category_id: 2, description: 'Azithral 500 contains Azithromycin, a macrolide antibiotic used to treat various bacterial infections.',
      uses: 'Bacterial infections of the throat, respiratory tract, ear, skin',
      composition: 'Azithromycin 500mg', strength: '500mg', dosage_form: 'Tablet', pack_size: 3,
      unit_type: 'tablet', unit_price: 75.00, mrp: 225.00, discount: 15,
      prescription_required: 1, individually_dispensable: 0, min_order: 3, max_order: 9,
      storage: 'Store below 30°C. Protect from moisture and light.', 
      warnings: 'Prescription required. Complete the full course of antibiotics. Do not self-medicate.',
      side_effects: 'Diarrhoea, Nausea, Abdominal pain. Report allergic reactions immediately.',
      dosage_info: 'Strictly as prescribed by your physician. Do not alter the course.', 
      image_url: null, stock: 120, threshold: 20
    },

    // Diabetes
    {
      name: 'Glycomet GP 2', generic_name: 'Metformin + Glimepiride', brand: 'Glycomet', manufacturer: 'USV Pvt Ltd',
      category_id: 3, description: 'Glycomet GP 2 is used in the management of type 2 diabetes mellitus.',
      uses: 'Type 2 Diabetes Mellitus, Blood sugar management',
      composition: 'Metformin 500mg + Glimepiride 2mg', strength: '500mg/2mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 8.50, mrp: 85.00, discount: 10,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 90,
      storage: 'Store below 30°C in a dry place.', 
      warnings: 'Prescription required. Regular blood sugar monitoring is essential. Inform doctor about kidney/liver conditions.',
      side_effects: 'Hypoglycemia, Nausea, Stomach upset. Monitor blood sugar regularly.',
      dosage_info: 'Strictly as prescribed by your physician. Regular monitoring required.', 
      image_url: null, stock: 300, threshold: 30
    },
    {
      name: 'Janumet 50/500', generic_name: 'Sitagliptin + Metformin', brand: 'Janumet', manufacturer: 'MSD Pharmaceuticals',
      category_id: 3, description: 'Janumet is used in the management of type 2 diabetes mellitus.',
      uses: 'Type 2 Diabetes Mellitus, Blood glucose control',
      composition: 'Sitagliptin 50mg + Metformin 500mg', strength: '50mg/500mg', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 35.00, mrp: 525.00, discount: 8,
      prescription_required: 1, individually_dispensable: 0, min_order: 15, max_order: 60,
      storage: 'Store below 30°C.', 
      warnings: 'Prescription required. Not for type 1 diabetes. Regular monitoring advised.',
      side_effects: 'Upper respiratory tract infection, Stuffy nose, Headache. Consult doctor for persistent symptoms.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 150, threshold: 20
    },
    {
      name: 'Glucobay 50', generic_name: 'Acarbose', brand: 'Glucobay', manufacturer: 'Bayer Pharmaceuticals',
      category_id: 3, description: 'Glucobay is used to manage blood sugar levels in type 2 diabetes.',
      uses: 'Type 2 Diabetes, Post-meal blood sugar control',
      composition: 'Acarbose 50mg', strength: '50mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 12.00, mrp: 120.00, discount: 5,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 60,
      storage: 'Store below 25°C. Protect from moisture.', 
      warnings: 'Prescription required. Inform doctor about intestinal disorders.',
      side_effects: 'Flatulence, Diarrhoea, Abdominal pain.',
      dosage_info: 'As prescribed by your physician.', 
      image_url: null, stock: 180, threshold: 20
    },

    // Blood Pressure
    {
      name: 'Amlodac 5', generic_name: 'Amlodipine', brand: 'Amlodac', manufacturer: 'Zydus Healthcare',
      category_id: 4, description: 'Amlodac 5 contains Amlodipine, a calcium channel blocker used to manage hypertension.',
      uses: 'Hypertension (High Blood Pressure), Angina',
      composition: 'Amlodipine 5mg', strength: '5mg', dosage_form: 'Tablet', pack_size: 14,
      unit_type: 'tablet', unit_price: 3.00, mrp: 42.00, discount: 10,
      prescription_required: 1, individually_dispensable: 0, min_order: 14, max_order: 84,
      storage: 'Store below 30°C.', 
      warnings: 'Prescription required. Do not stop abruptly. Regular BP monitoring required.',
      side_effects: 'Ankle swelling, Headache, Flushing. Report unusual symptoms to your doctor.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 400, threshold: 40
    },
    {
      name: 'Telmisartan 40', generic_name: 'Telmisartan', brand: 'Telma', manufacturer: 'Glenmark Pharma',
      category_id: 4, description: 'Telma contains Telmisartan, an angiotensin II receptor blocker (ARB) used for hypertension.',
      uses: 'Hypertension, Cardiovascular risk reduction',
      composition: 'Telmisartan 40mg', strength: '40mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 6.00, mrp: 60.00, discount: 12,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 60,
      storage: 'Store below 30°C in a dry place.', 
      warnings: 'Prescription required. Not for pregnant women. Monitor kidney function regularly.',
      side_effects: 'Dizziness, Back pain, Nasal congestion. Consult your doctor if symptoms persist.',
      dosage_info: 'As prescribed by your physician.', 
      image_url: null, stock: 350, threshold: 35
    },

    // Vitamins & Supplements
    {
      name: 'Becosules Capsule', generic_name: 'B-Complex + Vitamin C', brand: 'Becosules', manufacturer: 'Pfizer Ltd',
      category_id: 5, description: 'Becosules is a multivitamin capsule containing B-complex vitamins and Vitamin C.',
      uses: 'Vitamin B deficiency, General weakness, Nutritional supplementation, Mouth ulcers',
      composition: 'Thiamine (B1), Riboflavin (B2), Niacin (B3), Pantothenic acid (B5), Pyridoxine (B6), Biotin (B7), Folic acid (B9), Cyanocobalamin (B12), Ascorbic acid (C)',
      strength: 'Multivitamin', dosage_form: 'Capsule', pack_size: 20,
      unit_type: 'capsule', unit_price: 1.15, mrp: 23.00, discount: 5,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 200,
      storage: 'Store below 25°C. Protect from light and moisture.', 
      warnings: 'Not a substitute for a balanced diet. Consult doctor before use during pregnancy.',
      side_effects: 'Generally well-tolerated. Urine discoloration (harmless). Rarely, mild stomach upset.',
      dosage_info: 'As directed by your physician or as mentioned on the label.', 
      image_url: null, stock: 700, threshold: 80
    },
    {
      name: 'Shelcal 500', generic_name: 'Calcium + Vitamin D3', brand: 'Shelcal', manufacturer: 'Torrent Pharma',
      category_id: 5, description: 'Shelcal 500 is a calcium and Vitamin D3 supplement used for bone health.',
      uses: 'Calcium deficiency, Bone health, Osteoporosis prevention, Vitamin D deficiency',
      composition: 'Calcium Carbonate equivalent to elemental Calcium 500mg + Vitamin D3 250 IU', strength: '500mg/250IU', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 7.50, mrp: 112.50, discount: 10,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 90,
      storage: 'Store below 30°C. Protect from moisture.', 
      warnings: 'Consult doctor if taking other calcium supplements. Not for patients with hypercalcemia.',
      side_effects: 'Constipation (uncommon), Bloating. Drink adequate water.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 550, threshold: 60
    },
    {
      name: 'Supradyn Daily', generic_name: 'Multivitamin + Minerals', brand: 'Supradyn', manufacturer: 'Bayer Consumer Health',
      category_id: 5, description: 'Supradyn Daily is a comprehensive multivitamin and mineral supplement.',
      uses: 'Nutritional supplementation, General weakness, Immune support, Daily vitamin needs',
      composition: 'Vitamin A, B1, B2, B3, B5, B6, B12, C, D, E, Folic Acid, Iron, Zinc, Magnesium, and other minerals',
      strength: 'Multivitamin', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 10.00, mrp: 150.00, discount: 8,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 90,
      storage: 'Store below 30°C in a dry place.', 
      warnings: 'Dietary supplement, not a medicine. Keep away from children.',
      side_effects: 'Generally well tolerated. Mild stomach discomfort in rare cases.',
      dosage_info: 'One tablet daily or as directed by your physician.', 
      image_url: null, stock: 420, threshold: 50
    },

    // Digestive Health
    {
      name: 'Pan 40', generic_name: 'Pantoprazole', brand: 'Pan', manufacturer: 'Alkem Laboratories',
      category_id: 6, description: 'Pan 40 contains Pantoprazole, a proton pump inhibitor used to reduce stomach acid.',
      uses: 'Acidity, Gastroesophageal reflux (GERD), Peptic ulcers, Acid-related stomach disorders',
      composition: 'Pantoprazole 40mg', strength: '40mg', dosage_form: 'Tablet', pack_size: 15,
      unit_type: 'tablet', unit_price: 6.50, mrp: 97.50, discount: 15,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 90,
      storage: 'Store below 30°C. Protect from moisture.', 
      warnings: 'Not for long-term use without medical advice. Inform doctor about liver conditions.',
      side_effects: 'Headache, Diarrhea, Nausea (uncommon). Consult doctor for prolonged use.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 500, threshold: 50
    },
    {
      name: 'Digene Gel', generic_name: 'Aluminium Hydroxide + Magnesium Hydroxide + Simethicone', brand: 'Digene', manufacturer: 'Abbott India',
      category_id: 6, description: 'Digene Gel is an antacid used for the relief of acidity, heartburn, and gas.',
      uses: 'Acidity, Heartburn, Gas, Bloating, Indigestion',
      composition: 'Dried Aluminium Hydroxide + Magnesium Hydroxide + Simethicone', strength: 'Gel', dosage_form: 'Liquid', pack_size: 1,
      unit_type: 'bottle (200ml)', unit_price: 110.00, mrp: 110.00, discount: 5,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 10,
      storage: 'Store below 30°C. Shake well before use.', 
      warnings: 'Not for prolonged use without medical advice.',
      side_effects: 'Constipation or diarrhea (uncommon).',
      dosage_info: 'As directed by your physician or as mentioned on the label.', 
      image_url: null, stock: 200, threshold: 25
    },
    {
      name: 'Econorm 250', generic_name: 'Saccharomyces Boulardii', brand: 'Econorm', manufacturer: 'Dr. Reddy\'s',
      category_id: 6, description: 'Econorm 250 is a probiotic capsule used to restore gut flora balance.',
      uses: 'Diarrhea, Antibiotic-associated diarrhea, Gut health, Probiotic supplementation',
      composition: 'Saccharomyces Boulardii 250mg', strength: '250mg', dosage_form: 'Capsule', pack_size: 10,
      unit_type: 'capsule', unit_price: 16.00, mrp: 160.00, discount: 10,
      prescription_required: 0, individually_dispensable: 1, min_order: 1, max_order: 60,
      storage: 'Store below 25°C. Protect from moisture and heat.', 
      warnings: 'Consult doctor if immunocompromised. Store properly to maintain probiotic viability.',
      side_effects: 'Generally well tolerated. Mild bloating initially in some individuals.',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 300, threshold: 30
    },

    // Skin Care
    {
      name: 'Betadine Ointment', generic_name: 'Povidone-Iodine', brand: 'Betadine', manufacturer: 'Win-Medicare',
      category_id: 7, description: 'Betadine Ointment is an antiseptic used for the prevention and treatment of wound infections.',
      uses: 'Minor wound infections, Cuts, Burns, Skin disinfection',
      composition: 'Povidone-Iodine 5% w/w', strength: '5%', dosage_form: 'Ointment', pack_size: 1,
      unit_type: 'tube (15g)', unit_price: 52.00, mrp: 52.00, discount: 5,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 10,
      storage: 'Store below 25°C. For external use only.', 
      warnings: 'For external use only. Avoid contact with eyes. Not for patients with iodine allergy.',
      side_effects: 'Local irritation (rare), Skin staining (temporary).',
      dosage_info: 'Apply as needed on affected area. For external use only.', 
      image_url: null, stock: 250, threshold: 30
    },
    {
      name: 'Candid Cream', generic_name: 'Clotrimazole', brand: 'Candid', manufacturer: 'Glenmark Pharma',
      category_id: 7, description: 'Candid Cream contains Clotrimazole, an antifungal used to treat skin fungal infections.',
      uses: 'Fungal skin infections, Ringworm, Athlete\'s foot, Skin candidiasis',
      composition: 'Clotrimazole 1% w/w', strength: '1%', dosage_form: 'Cream', pack_size: 1,
      unit_type: 'tube (20g)', unit_price: 85.00, mrp: 85.00, discount: 8,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 5,
      storage: 'Store below 25°C. For external use only.', 
      warnings: 'For external use only. Discontinue if irritation occurs. Not for use in eyes.',
      side_effects: 'Local burning, Skin irritation (rare).',
      dosage_info: 'Apply to affected area as directed by your physician.', 
      image_url: null, stock: 180, threshold: 20
    },

    // First Aid
    {
      name: 'Band-Aid Flexible Fabric', generic_name: 'Adhesive Bandage', brand: 'Band-Aid', manufacturer: 'Johnson & Johnson',
      category_id: 9, description: 'Band-Aid Flexible Fabric adhesive bandages for wound protection.',
      uses: 'Minor cuts, Scrapes, Wound protection',
      composition: 'Sterile adhesive bandage with absorbent pad', strength: 'N/A', dosage_form: 'Bandage', pack_size: 10,
      unit_type: 'piece', unit_price: 4.00, mrp: 40.00, discount: 5,
      prescription_required: 0, individually_dispensable: 0, min_order: 10, max_order: 100,
      storage: 'Store in a cool, dry place.', 
      warnings: 'For external use only. Replace if wet or soiled.',
      side_effects: 'Skin irritation from adhesive (rare).',
      dosage_info: 'Apply over cleaned wound. Replace as needed.', 
      image_url: null, stock: 500, threshold: 50
    },
    {
      name: 'Dettol Antiseptic Liquid', generic_name: 'Chloroxylenol', brand: 'Dettol', manufacturer: 'Reckitt Benckiser',
      category_id: 9, description: 'Dettol Antiseptic Liquid for personal hygiene and first aid.',
      uses: 'Wound cleaning, Personal hygiene, Antiseptic wash',
      composition: 'Chloroxylenol 4.8% w/v', strength: '4.8%', dosage_form: 'Liquid', pack_size: 1,
      unit_type: 'bottle (60ml)', unit_price: 38.00, mrp: 38.00, discount: 5,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 10,
      storage: 'Store below 30°C. Keep away from children.', 
      warnings: 'For external use only. Do not apply undiluted on wounds. Avoid contact with eyes.',
      side_effects: 'Skin irritation if used undiluted.',
      dosage_info: 'Dilute before use as per label instructions.', 
      image_url: null, stock: 350, threshold: 40
    },

    // Antibiotics
    {
      name: 'Augmentin 625 Duo', generic_name: 'Amoxicillin + Clavulanic Acid', brand: 'Augmentin', manufacturer: 'GlaxoSmithKline',
      category_id: 12, description: 'Augmentin 625 Duo is a combination antibiotic used to treat various bacterial infections.',
      uses: 'Bacterial infections of ear, nose, throat, lungs, urinary tract, skin',
      composition: 'Amoxicillin 500mg + Clavulanic Acid 125mg', strength: '625mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 25.00, mrp: 250.00, discount: 12,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 30,
      storage: 'Store below 25°C. Protect from moisture.', 
      warnings: 'Prescription required. Complete the full antibiotic course. Do not self-medicate with antibiotics.',
      side_effects: 'Diarrhea, Nausea, Vomiting, Skin rash (uncommon). Report allergic reactions immediately.',
      dosage_info: 'Strictly as prescribed by your physician. Complete the full course.', 
      image_url: null, stock: 180, threshold: 20
    },
    {
      name: 'Ciprofloxacin 500', generic_name: 'Ciprofloxacin', brand: 'Ciplox', manufacturer: 'Cipla Ltd',
      category_id: 12, description: 'Ciplox 500 contains Ciprofloxacin, a fluoroquinolone antibiotic.',
      uses: 'Urinary tract infections, Respiratory infections, Gastrointestinal infections',
      composition: 'Ciprofloxacin 500mg', strength: '500mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 8.00, mrp: 80.00, discount: 10,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 30,
      storage: 'Store below 30°C. Protect from light.', 
      warnings: 'Prescription required. Avoid sunlight exposure. Not for children/adolescents without medical advice.',
      side_effects: 'Nausea, Diarrhea, Headache, Dizziness. Report tendon pain immediately.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 250, threshold: 25
    },

    // Eye & Ear Care
    {
      name: 'Refresh Tears', generic_name: 'Carboxymethylcellulose', brand: 'Refresh Tears', manufacturer: 'Allergan India',
      category_id: 13, description: 'Refresh Tears are lubricant eye drops used for dry eye relief.',
      uses: 'Dry eyes, Eye irritation, Eye discomfort, Artificial tear supplementation',
      composition: 'Carboxymethylcellulose Sodium 0.5%', strength: '0.5%', dosage_form: 'Eye Drops', pack_size: 1,
      unit_type: 'bottle (10ml)', unit_price: 130.00, mrp: 130.00, discount: 10,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 5,
      storage: 'Store below 25°C. Discard 28 days after opening.', 
      warnings: 'For ophthalmic use only. Do not touch dropper tip. Remove contact lenses before use.',
      side_effects: 'Temporary blurred vision, Mild stinging (rare).',
      dosage_info: 'As directed by your physician.', 
      image_url: null, stock: 150, threshold: 20
    },

    // Respiratory
    {
      name: 'Asthalin Inhaler', generic_name: 'Salbutamol', brand: 'Asthalin', manufacturer: 'Cipla Ltd',
      category_id: 14, description: 'Asthalin Inhaler contains Salbutamol, a bronchodilator used for asthma and breathing difficulties.',
      uses: 'Asthma, Bronchospasm, Wheezing, Breathing difficulty',
      composition: 'Salbutamol 100mcg/actuation', strength: '100mcg', dosage_form: 'Inhaler', pack_size: 1,
      unit_type: 'inhaler (200 doses)', unit_price: 135.00, mrp: 135.00, discount: 5,
      prescription_required: 1, individually_dispensable: 0, min_order: 1, max_order: 3,
      storage: 'Store below 30°C. Do not freeze. Protect from direct sunlight.', 
      warnings: 'Prescription required. Learn proper inhaler technique. Do not exceed recommended dose.',
      side_effects: 'Tremor, Headache, Rapid heartbeat (at higher doses). Consult doctor if symptoms worsen.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 80, threshold: 10
    },

    // Heart Care
    {
      name: 'Ecosprin 75', generic_name: 'Aspirin', brand: 'Ecosprin', manufacturer: 'USV Pvt Ltd',
      category_id: 15, description: 'Ecosprin 75 contains low-dose Aspirin used for cardiovascular risk reduction.',
      uses: 'Heart attack prevention, Stroke prevention, Blood clot prevention',
      composition: 'Aspirin (Acetylsalicylic acid) 75mg', strength: '75mg', dosage_form: 'Tablet', pack_size: 14,
      unit_type: 'tablet', unit_price: 1.40, mrp: 19.60, discount: 5,
      prescription_required: 1, individually_dispensable: 0, min_order: 14, max_order: 84,
      storage: 'Store below 30°C. Protect from moisture.', 
      warnings: 'Prescription required. Not for patients with bleeding disorders or aspirin allergy. Not for children under 16.',
      side_effects: 'Stomach upset, Increased bleeding tendency. Report unusual bleeding or bruising.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 600, threshold: 60
    },
    {
      name: 'Atorvastatin 10', generic_name: 'Atorvastatin', brand: 'Atorva', manufacturer: 'Zydus Healthcare',
      category_id: 15, description: 'Atorva contains Atorvastatin, a statin used to lower cholesterol levels.',
      uses: 'High cholesterol, Cardiovascular risk reduction, Dyslipidemia',
      composition: 'Atorvastatin 10mg', strength: '10mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 5.00, mrp: 50.00, discount: 15,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 60,
      storage: 'Store below 30°C.', 
      warnings: 'Prescription required. Inform doctor about liver conditions. Avoid grapefruit juice.',
      side_effects: 'Muscle pain (uncommon), Headache, Nausea. Report unexplained muscle pain immediately.',
      dosage_info: 'Strictly as prescribed by your physician.', 
      image_url: null, stock: 400, threshold: 40
    },

    // Baby Care
    {
      name: 'Gripe Water', generic_name: 'Dill Oil + Sarjikakshara', brand: 'Woodwards', manufacturer: 'TTK Healthcare',
      category_id: 8, description: 'Woodwards Gripe Water is traditionally used for colic relief in infants.',
      uses: 'Colic, Wind pain in infants, Stomach discomfort in babies',
      composition: 'Dill Oil + Sarjikakshara', strength: 'Liquid', dosage_form: 'Liquid', pack_size: 1,
      unit_type: 'bottle (130ml)', unit_price: 55.00, mrp: 55.00, discount: 5,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 5,
      storage: 'Store below 30°C. Keep away from direct sunlight.', 
      warnings: 'For infant use under adult supervision. Consult pediatrician before use.',
      side_effects: 'Generally well tolerated when used as directed.',
      dosage_info: 'As mentioned on the label or as directed by your pediatrician.', 
      image_url: null, stock: 200, threshold: 25
    },

    // Low stock items
    {
      name: 'Montair LC', generic_name: 'Montelukast + Levocetirizine', brand: 'Montair', manufacturer: 'Cipla Ltd',
      category_id: 2, description: 'Montair LC is used for the relief of allergic symptoms and asthma prevention.',
      uses: 'Allergic rhinitis, Asthma prevention, Sneezing, Watery eyes',
      composition: 'Montelukast 10mg + Levocetirizine 5mg', strength: '10mg/5mg', dosage_form: 'Tablet', pack_size: 10,
      unit_type: 'tablet', unit_price: 12.00, mrp: 120.00, discount: 10,
      prescription_required: 1, individually_dispensable: 0, min_order: 10, max_order: 30,
      storage: 'Store below 30°C.', 
      warnings: 'Prescription required. May cause drowsiness.',
      side_effects: 'Drowsiness, Headache, Dry mouth.',
      dosage_info: 'As prescribed by your physician.', 
      image_url: null, stock: 8, threshold: 15
    },

    // Out of stock item
    {
      name: 'Volini Spray', generic_name: 'Diclofenac + Methyl Salicylate + Menthol', brand: 'Volini', manufacturer: 'Sun Pharma',
      category_id: 1, description: 'Volini Spray is a topical pain relief spray for muscle and joint pain.',
      uses: 'Muscle pain, Joint pain, Back pain, Sprains, Sports injuries',
      composition: 'Diclofenac Diethylamine + Methyl Salicylate + Menthol + Linseed Oil', strength: 'Topical', dosage_form: 'Spray', pack_size: 1,
      unit_type: 'can (40g)', unit_price: 210.00, mrp: 210.00, discount: 10,
      prescription_required: 0, individually_dispensable: 0, min_order: 1, max_order: 5,
      storage: 'Store below 30°C. Inflammable, keep away from flame.', 
      warnings: 'For external use only. Do not spray on broken skin or wounds. Highly inflammable.',
      side_effects: 'Skin irritation, Redness at application site (rare).',
      dosage_info: 'Spray on affected area as needed. For external use only.', 
      image_url: null, stock: 0, threshold: 10
    },
  ];

  for (const med of medicines) {
    const result = insertMedicine.run(
      med.name, med.generic_name, med.brand, med.manufacturer, med.category_id,
      med.description, med.uses, med.composition, med.strength, med.dosage_form,
      med.pack_size, med.unit_type, med.unit_price, med.mrp, med.discount,
      med.prescription_required, med.individually_dispensable, med.min_order || 1,
      med.max_order || 100, med.storage, med.warnings, med.side_effects, med.dosage_info, med.image_url
    );
    insertInventory.run(result.lastInsertRowid, med.stock, med.threshold);
  }

  console.log(`✅ ${medicines.length} medicines seeded`);

  // Add sample addresses for demo user
  const insertAddress = db.prepare(`
    INSERT INTO addresses (user_id, label, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAddress.run(2, 'Home', 'Demo Customer', '9876543211', '42, MG Road', 'Near City Mall', 'Mumbai', 'Maharashtra', '400001', 1);
  insertAddress.run(2, 'Work', 'Demo Customer', '9876543211', '15, Tech Park', 'Whitefield', 'Bangalore', 'Karnataka', '560066', 0);

  console.log('✅ Addresses seeded');
  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log('');
  console.log('Demo Accounts (created via signup for production use):');
  console.log('  Admin: admin@epharmacy.com / Admin@123456');
  console.log('  User:  user@epharmacy.com / User@123456');
}

seed();

const fs = require('fs');
const path = require('path');
const https = require('https');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, 'epharmacy.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'medicines');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const medicineImages = {
  'Dolo 650': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'Crocin Advance': 'https://images.unsplash.com/photo-1550572017-edf792891e03?auto=format&fit=crop&w=600&q=80',
  'Combiflam': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  'Voveran SR 100': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'Sinarest New': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80',
  'Cetrizine 10mg': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
  'Azithral 500': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'Glycomet GP 2': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  'Janumet 50/500': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  'Glucobay 50': 'https://images.unsplash.com/photo-1550572017-edf792891e03?auto=format&fit=crop&w=600&q=80',
  'Amlodac 5': 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_q4BFQHt92DQCgppzYlCQVW4RiaX1uFU2wfkMdUcw1Q&s=10',
  'Telmisartan 40': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'Becosules Capsule': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  'Shelcal 500': 'https://images.unsplash.com/photo-1550572017-edf792891e03?auto=format&fit=crop&w=600&q=80',
  'Supradyn Daily': 'https://images.unsplash.com/photo-1628771065518-0d82f1938462?auto=format&fit=crop&w=600&q=80',
  'Pan 40': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'Digene Gel': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
  'Econorm 250': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?auto=format&fit=crop&w=600&q=80',
  'Betadine Ointment': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'Candid Cream': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80',
  'Band-Aid Flexible Fabric': 'https://images.unsplash.com/photo-1603398938378-e54eab446dde?auto=format&fit=crop&w=600&q=80',
  'Dettol Antiseptic Liquid': 'https://images.unsplash.com/photo-1584483766114-2cea6facdf57?auto=format&fit=crop&w=600&q=80',
  'Augmentin 625 Duo': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'Ciprofloxacin 500': 'https://images.unsplash.com/photo-1550572017-edf792891e03?auto=format&fit=crop&w=600&q=80',
  'Refresh Tears': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=600&q=80',
  'Asthalin Inhaler': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80',
  'Ecosprin 75': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
  'Atorvastatin 10': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
  'Gripe Water': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80',
  'Montair LC': 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=600&q=80',
  'Volini Spray': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&w=600&q=80'
};

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close(() => resolve(true));
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => { });
      reject(err);
    });
  });
}

async function run() {
  const db = new Database(DB_PATH);
  const updateStmt = db.prepare('UPDATE medicines SET image_url = ? WHERE name = ?');

  const medicines = db.prepare('SELECT id, name FROM medicines').all();
  console.log(`Found ${medicines.length} medicines in database.`);

  for (const med of medicines) {
    const imgUrl = medicineImages[med.name] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80';
    const filename = `${med.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.jpg`;
    const localPath = path.join(UPLOADS_DIR, filename);
    const relativeUrl = `/uploads/medicines/${filename}`;

    try {
      console.log(`Downloading image for ${med.name}...`);
      await downloadFile(imgUrl, localPath);
      updateStmt.run(relativeUrl, med.name);
      console.log(`Updated ${med.name} -> ${relativeUrl}`);
    } catch (err) {
      console.error(`Failed local download for ${med.name}, using CDN URL:`, err.message);
      updateStmt.run(imgUrl, med.name);
    }
  }

  console.log('✅ Medicine images updated successfully!');
}

run();

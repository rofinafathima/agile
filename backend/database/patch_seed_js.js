const fs = require('fs');
const path = require('path');

const SEED_FILE = path.join(__dirname, 'seed.js');
let seedContent = fs.readFileSync(SEED_FILE, 'utf8');

// Regex replace pattern for image_url: null based on preceding medicine name
const nameImageMap = {
  'Dolo 650': '/uploads/medicines/dolo_650.jpg',
  'Crocin Advance': '/uploads/medicines/crocin_advance.jpg',
  'Combiflam': '/uploads/medicines/combiflam.jpg',
  'Voveran SR 100': '/uploads/medicines/voveran_sr_100.jpg',
  'Sinarest New': '/uploads/medicines/sinarest_new.jpg',
  'Cetrizine 10mg': '/uploads/medicines/cetrizine_10mg.jpg',
  'Azithral 500': '/uploads/medicines/azithral_500.jpg',
  'Glycomet GP 2': '/uploads/medicines/glycomet_gp_2.jpg',
  'Janumet 50/500': '/uploads/medicines/janumet_50_500.jpg',
  'Glucobay 50': '/uploads/medicines/glucobay_50.jpg',
  'Amlodac 5': '/uploads/medicines/amlodac_5.jpg',
  'Telmisartan 40': '/uploads/medicines/telmisartan_40.jpg',
  'Becosules Capsule': '/uploads/medicines/becosules_capsule.jpg',
  'Shelcal 500': '/uploads/medicines/shelcal_500.jpg',
  'Supradyn Daily': '/uploads/medicines/supradyn_daily.jpg',
  'Pan 40': '/uploads/medicines/pan_40.jpg',
  'Digene Gel': '/uploads/medicines/digene_gel.jpg',
  'Econorm 250': '/uploads/medicines/econorm_250.jpg',
  'Betadine Ointment': '/uploads/medicines/betadine_ointment.jpg',
  'Candid Cream': '/uploads/medicines/candid_cream.jpg',
  'Band-Aid Flexible Fabric': '/uploads/medicines/band_aid_flexible_fabric.jpg',
  'Dettol Antiseptic Liquid': '/uploads/medicines/dettol_antiseptic_liquid.jpg',
  'Augmentin 625 Duo': '/uploads/medicines/augmentin_625_duo.jpg',
  'Ciprofloxacin 500': '/uploads/medicines/ciprofloxacin_500.jpg',
  'Refresh Tears': '/uploads/medicines/refresh_tears.jpg',
  'Asthalin Inhaler': '/uploads/medicines/asthalin_inhaler.jpg',
  'Ecosprin 75': '/uploads/medicines/ecosprin_75.jpg',
  'Atorvastatin 10': '/uploads/medicines/atorvastatin_10.jpg',
  'Gripe Water': '/uploads/medicines/gripe_water.jpg',
  'Montair LC': '/uploads/medicines/montair_lc.jpg',
  'Volini Spray': '/uploads/medicines/volini_spray.jpg',
};

for (const [name, url] of Object.entries(nameImageMap)) {
  const safeName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(name:\\s*'${safeName}'[\\s\\S]*?)image_url:\\s*null`, 'g');
  seedContent = seedContent.replace(regex, `$1image_url: '${url}'`);
}

fs.writeFileSync(SEED_FILE, seedContent, 'utf8');
console.log('✅ seed.js updated with image URLs!');

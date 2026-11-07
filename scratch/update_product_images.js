const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');

const imageMap = {
  // COMBOS
  "cb-1": "https://images.unsplash.com/photo-1627059312520-2182d334586c?w=600&auto=format&fit=crop&q=80",
  "cb-2": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
  "cb-3": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
  "cb-4": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",

  // HOT DOGS PRENSADOS
  "hd-1": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
  "hd-2": "https://images.unsplash.com/photo-1627059312520-2182d334586c?w=600&auto=format&fit=crop&q=80",
  "hd-3": "https://images.unsplash.com/photo-1612392062631-94dd85fa2dd1?w=600&auto=format&fit=crop&q=80",
  "hd-4": "https://images.unsplash.com/photo-1627059312520-2182d334586c?w=600&auto=format&fit=crop&q=80",

  // BURGERS & SMASHES
  "bg-1": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  "bg-2": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
  "bg-3": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&auto=format&fit=crop&q=80",
  "bg-4": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",

  // PIZZAS & CALZONES
  "pz-1": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
  "pz-2": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
  "pz-3": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",

  // PASTÉIS CROCANTES
  "pt-1": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  "pt-2": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
  "pt-3": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
  "pt-4": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",

  // TAPIOCAS RECHEADAS
  "tp-1": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  "tp-2": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  "tp-3": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",

  // PORÇÕES & PETISCOS
  "pc-1": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
  "pc-2": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",
  "pc-3": "https://images.unsplash.com/photo-1639024471287-0352167389a0?w=600&auto=format&fit=crop&q=80",
  "pc-4": "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop&q=80",

  // BEBIDAS & SUCOS
  "bb-1": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
  "bb-2": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80",
  "bb-3": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
  "bb-4": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
  "bb-5": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
  "bb-6": "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80",

  // SOBREMESAS & AÇAÍ
  "sb-1": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
  "sb-2": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
};

// 1. Update data/db.json
const dbPath = path.join(rootDir, 'data', 'db.json');
if (fs.existsSync(dbPath)) {
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  let updatedCount = 0;
  if (db.products && Array.isArray(db.products)) {
    db.products.forEach(p => {
      if (imageMap[p.id]) {
        p.image = imageMap[p.id];
        updatedCount++;
      }
    });
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
    console.log(`Updated ${updatedCount} products in ${dbPath}`);
  }
}

// 2. Update lib/mock-data.ts
const mockPath = path.join(rootDir, 'lib', 'mock-data.ts');
if (fs.existsSync(mockPath)) {
  let content = fs.readFileSync(mockPath, 'utf8');
  for (const [id, url] of Object.entries(imageMap)) {
    const re = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?image:\\s*)"[^"]+"`, 'g');
    content = content.replace(re, `$1"${url}"`);
  }
  fs.writeFileSync(mockPath, content, 'utf8');
  console.log(`Updated images in ${mockPath}`);
}

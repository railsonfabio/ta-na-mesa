const fs = require('fs');
const https = require('https');

// Pool of verified working images by category
const verifiedPool = {
  // Hot dogs & Combos
  "cb-1": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
  "cb-2": "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80",
  "cb-3": "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
  "cb-4": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",

  "hd-1": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
  "hd-2": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
  "hd-3": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
  "hd-4": "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",

  // Burgers
  "bg-1": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  "bg-2": "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=600&auto=format&fit=crop&q=80",
  "bg-3": "https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=600&auto=format&fit=crop&q=80",
  "bg-4": "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80",

  // Pizzas
  "pz-1": "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
  "pz-2": "https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=600&auto=format&fit=crop&q=80",
  "pz-3": "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80",

  // Pastéis
  "pt-1": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",
  "pt-2": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
  "pt-3": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
  "pt-4": "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80",

  // Tapiocas
  "tp-1": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  "tp-2": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",
  "tp-3": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80",

  // Porções
  "pc-1": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
  "pc-2": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
  "pc-3": "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
  "pc-4": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",

  // Bebidas
  "bb-1": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
  "bb-2": "https://images.unsplash.com/photo-1554866585-cd94860890b7?w=600&auto=format&fit=crop&q=80",
  "bb-3": "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
  "bb-4": "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
  "bb-5": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
  "bb-6": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&auto=format&fit=crop&q=80",

  // Sobremesas
  "sb-1": "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80",
  "sb-2": "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80"
};

function check(url) {
  return new Promise(res => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      res(r.statusCode);
    }).on('error', () => res(500));
  });
}

(async () => {
  let allOk = true;
  for (const [id, url] of Object.entries(verifiedPool)) {
    const status = await check(url);
    if (status !== 200) {
      console.log(`❌ ${id}: ${status}`);
      allOk = false;
    } else {
      console.log(`✅ ${id}: 200 OK`);
    }
  }

  if (allOk) {
    console.log('ALL 34 IMAGES ARE 100% 200 OK! Updating db.json and mock-data.ts...');
    const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));
    db.products.forEach(p => {
      if (verifiedPool[p.id]) {
        p.image = verifiedPool[p.id];
      }
    });
    db.lastUpdated = new Date().toISOString();
    fs.writeFileSync('./data/db.json', JSON.stringify(db, null, 2), 'utf8');

    let mock = fs.readFileSync('./lib/mock-data.ts', 'utf8');
    for (const [id, url] of Object.entries(verifiedPool)) {
      const re = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?image:\\s*)"[^"]+"`, 'g');
      mock = mock.replace(re, `$1"${url}"`);
    }
    fs.writeFileSync('./lib/mock-data.ts', mock, 'utf8');
    console.log('Successfully updated all 34 product images!');
  }
})();

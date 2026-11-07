const fs = require('fs');
const https = require('https');
const http = require('http');

const db = JSON.parse(fs.readFileSync('./data/db.json', 'utf8'));

function checkUrl(url) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      return resolve({ status: 'not_url', code: 0 });
    }
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      resolve({ status: res.statusCode === 200 ? 'OK' : 'FAIL', code: res.statusCode });
    });
    req.on('error', (err) => resolve({ status: 'ERROR', error: err.message }));
    req.setTimeout(4000, () => {
      req.destroy();
      resolve({ status: 'TIMEOUT' });
    });
  });
}

(async () => {
  console.log(`Checking ${db.products.length} product images...`);
  for (const p of db.products) {
    const res = await checkUrl(p.image);
    if (res.status !== 'OK') {
      console.log(`FAIL [${p.id}] ${p.name}: ${res.status} (${res.code}) -> ${p.image}`);
    } else {
      console.log(`OK [${p.id}]`);
    }
  }
})();

const https = require('https');

const candidates = {
  // Combos & Hot Dogs
  "hotdog": [
    "https://images.unsplash.com/photo-1619740455993-9e612b1af08a?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1612392062631-94dd85fa2dd1?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1627059312520-2182d334586c?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&auto=format&fit=crop&q=80"
  ],
  // Fries / Porções
  "fries": [
    "https://images.unsplash.com/photo-1585109649139-366815a0d713?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80"
  ],
  // Drinks
  "water": [
    "https://images.unsplash.com/photo-1559839914-1b3967d022b3?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=600&auto=format&fit=crop&q=80"
  ]
};

function check(url) {
  return new Promise(res => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, r => {
      res({ url, code: r.statusCode });
    }).on('error', () => res({ url, code: 500 }));
  });
}

(async () => {
  for (const [key, urls] of Object.entries(candidates)) {
    console.log(`--- Testing ${key} ---`);
    for (const u of urls) {
      const r = await check(u);
      console.log(`${r.code === 200 ? '✅' : '❌'} ${r.code}: ${u}`);
    }
  }
})();

const https = require('https');

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  const js = await get('https://instadelivery.com.br/js/d694707dbd770bf49de0.js');
  // find VUE_APP_API or api domain
  const apiMatches = js.match(/https?:\/\/[a-zA-Z0-9_\-\.]*api[a-zA-Z0-9_\-\.]*/gi) || [];
  console.log('API domain matches:', [...new Set(apiMatches)]);

  // search for "hotdogecia" or slug or store
  const slugMatches = js.match(/["'](\/api\/[^"']+)["']/g) || [];
  console.log('API endpoints sample:', [...new Set(slugMatches)].slice(0, 30));

  // Let's also check chunk 27 or chunk 36 or others
  const chunk27 = await get('https://instadelivery.com.br/js/27.d694707dbd770bf49de0.chunk.js');
  const urlsIn27 = chunk27.match(/https?:\/\/[^"'\s]+/g) || [];
  console.log('URLs in chunk 27:', [...new Set(urlsIn27)]);
}

run();

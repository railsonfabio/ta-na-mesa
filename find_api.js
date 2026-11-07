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
  // Let's find chunks with "slug" or router
  const indexJs = await get('https://instadelivery.com.br/js/d694707dbd770bf49de0.js');
  // find axios create or baseURL
  const match = indexJs.match(/axios\.create\(\{([^}]+)\}\)/);
  if (match) console.log('axios create:', match[1]);

  // let's look for how api calls are made
  const apis = indexJs.match(/https?:\/\/[^\s"'`]+/g) || [];
  console.log('URLs in indexJs:', [...new Set(apis)].filter(u => !u.includes('google') && !u.includes('nr-data')));

  // Check chunk 82 or others
  const chunk82 = await get('https://instadelivery.com.br/js/82.d694707dbd770bf49de0.chunk.js');
  const apis82 = chunk82.match(/https?:\/\/[^\s"'`]+/g) || [];
  console.log('URLs in chunk82:', [...new Set(apis82)].filter(u => !u.includes('google') && !u.includes('nr-data')));
}

run();

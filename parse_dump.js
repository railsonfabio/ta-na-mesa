const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\Fabio Barbosa\\Projetos\\ta-na-mesa\\instadelivery_dump.html', 'utf8');

const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
console.log('Title:', titleMatch ? titleMatch[1] : 'No title');

// Find all src or href
const hrefs = html.match(/(?:src|href)=["']([^"']+)["']/g) || [];
console.log('Hrefs/srcs count:', hrefs.length);
const jsFiles = hrefs.filter(h => h.includes('.js')).map(h => h.replace(/^(src|href)=["']/, '').replace(/["']$/, ''));
console.log('JS files:', jsFiles.slice(0, 10));

// Find any text containing hot dog, categories, or items
const bodyText = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
console.log('Visible text snippet:', bodyText.slice(0, 500));

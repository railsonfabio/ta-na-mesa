const fs = require('fs');
const html = fs.readFileSync('C:\\Users\\Fabio Barbosa\\Projetos\\ta-na-mesa\\instadelivery_dump.html', 'utf8');

const scripts = html.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
console.log('Script tags with src:', scripts);

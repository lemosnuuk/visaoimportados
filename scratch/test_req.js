const http = require('http');

function testUrl(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      console.log(`URL: ${url}`);
      console.log(`Status Code: ${res.statusCode}`);
      console.log(`Headers:`, res.headers);
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`Body (first 200 chars):`, data.substring(0, 200));
        console.log('------------------------------------');
        resolve();
      });
    }).on('error', (err) => {
      console.error(`Error requesting ${url}:`, err.message);
      resolve();
    });
  });
}

async function run() {
  await testUrl('http://localhost:3000/admin/produtos');
  await testUrl('http://localhost:3000/admin/login');
  await testUrl('http://localhost:3000/admin/movimentacoes');
  await testUrl('http://localhost:3000/');
}

run();

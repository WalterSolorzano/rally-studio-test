const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.pdf': 'application/pdf',
  '.md': 'text/markdown; charset=utf-8'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Mock API telemetría para evitar errores 404
  if (reqPath === '/api/telemetry') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }

  // Redirección directa desde raíz al dashboard
  if (reqPath === '' || reqPath === '/') {
    res.writeHead(302, { Location: '/dashboard/' });
    res.end();
    return;
  }

  if (reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }

  // Aliases seguros para recursos requeridos desde raíz
  if (reqPath === '/app.js') reqPath = '/dashboard/app.js';
  if (reqPath === '/style.css') reqPath = '/dashboard/style.css';

  const filePath = path.join(ROOT, decodeURIComponent(reqPath));

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': mime,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.on('error', (e) => {
  console.error('Server error:', e.message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Rally Studio server running at http://localhost:${PORT}/dashboard/`);
});

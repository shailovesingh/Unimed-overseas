import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, '../dist');
const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // Decode URL to handle spaces or special characters
  let decodedUrl = decodeURIComponent(req.url);
  
  // Clean query strings or hashes
  const questionMarkIndex = decodedUrl.indexOf('?');
  if (questionMarkIndex !== -1) {
    decodedUrl = decodedUrl.substring(0, questionMarkIndex);
  }
  const hashIndex = decodedUrl.indexOf('#');
  if (hashIndex !== -1) {
    decodedUrl = decodedUrl.substring(0, hashIndex);
  }

  let filePath = path.join(DIST, decodedUrl === '/' ? 'index.html' : decodedUrl);

  const serveFile = (targetPath, contentType) => {
    fs.readFile(targetPath, (error, content) => {
      if (error) {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  };

  fs.stat(filePath, (err, stats) => {
    if (err) {
      if (err.code === 'ENOENT') {
        const htmlPath = filePath + '.html';
        fs.stat(htmlPath, (htmlErr, htmlStats) => {
          if (!htmlErr && htmlStats.isFile()) {
            serveFile(htmlPath, MIME_TYPES['.html']);
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end('<h1>404 Not Found</h1><p>The requested file does not exist.</p>', 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else if (stats.isDirectory()) {
      const indexHtmlPath = path.join(filePath, 'index.html');
      serveFile(indexHtmlPath, MIME_TYPES['.html']);
    } else {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      serveFile(filePath, contentType);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

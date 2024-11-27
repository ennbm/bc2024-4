const http = require('http');
const { Command } = require('commander');
const path = require('path');
const fs = require('fs').promises;

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'address of the server')
  .requiredOption('-p, --port <port>', 'port of the server')
  .requiredOption('-c, --cache <directory>', 'path to cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

// Перетворення шляху на абсолютний
const cacheDir = path.isAbsolute(cache) ? cache : path.resolve(cache);

// Перевірка на існування директорії кешу
fs.mkdir(cacheDir, { recursive: true }).catch((err) => {
  console.error('Error creating cache directory:', err);
  process.exit(1);
});

const server = http.createServer(async (req, res) => {
  const urlParts = req.url.split('/');
  const statusCode = urlParts[1]; // отримуємо код статусу з URL

  if (!statusCode || isNaN(statusCode)) {
    return res.writeHead(400, { 'Content-Type': 'text/plain' })
      .end('Invalid status code');
  }

  const imagePath = path.join(cacheDir, `${statusCode}.jpg`);

  try {
    switch (req.method) {
      case 'GET':
        try {
          // Читання файлу з кешу
          const data = await fs.readFile(imagePath);
          res.writeHead(200, { 'Content-Type': 'image/jpeg' });
          res.end(data);
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Image not found');
        }
        break;

      case 'PUT':
        const chunks = [];
        // Для PUT, ми збираємо тіло запиту, яке буде містити картинку
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', async () => {
          const imageBuffer = Buffer.concat(chunks);

          try {
            // Записуємо картинку в кеш
            await fs.writeFile(imagePath, imageBuffer);
            res.writeHead(201, { 'Content-Type': 'text/plain' });
            res.end('Image created or updated successfully');
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Error saving image');
          }
        });
        break;

      case 'DELETE':
        try {
          // Видалення картинки з кешу
          await fs.unlink(imagePath);
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Image deleted successfully');
        } catch (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Image not found');
        }
        break;

      default:
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
    }
  } catch (err) {
    console.error('Error handling request:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  }
});

server.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}/`);
});

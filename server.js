const http = require('http');
const { Command } = require('commander');
const path = require('path'); // Підключаємо модуль один раз

const program = new Command();

program
  .requiredOption('-h, --host <host>', 'address of the server')
  .requiredOption('-p, --port <port>', 'port of the server')
  .requiredOption('-c, --cache <directory>', 'path to cache directory');

program.parse(process.argv);

const { host, port, cache } = program.opts();

// Перетворення шляху на абсолютний
const cacheDir = path.isAbsolute(cache) ? cache : path.resolve(cache);

console.log(`Cache directory: ${cacheDir}`);

// Перевірка абсолютного шляху (опціонально, після перетворення це завжди true)
if (!path.isAbsolute(cacheDir)) {
  console.error('Cache directory path must be absolute.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Server running at http://${host}:${port}/`);
});

server.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}/`);
});

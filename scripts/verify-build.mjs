import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { extname, posix } from 'node:path';
import { createServer } from 'node:http';

const output = new URL('../dist/', import.meta.url);
const source = new URL('../source/dist/', import.meta.url);
const files = new Map();
async function collect(dir = '') {
  for (const item of await readdir(new URL(dir, output), { withFileTypes: true })) {
    const name = dir + item.name;
    if (item.isDirectory()) await collect(`${name}/`);
    else files.set(name, await readFile(new URL(name, output)));
  }
}
await collect();
for (const name of ['index.html', 'film.html', '.nojekyll', 'assets/campus-score.mp3', 'assets/CREDITS.txt']) {
  assert.ok(files.has(name), `Missing deployment file: ${name}`);
}
for (const name of ['index.html', 'film.html']) {
  const original = await readFile(new URL(name, source), 'utf8');
  const built = files.get(name).toString();
  const ids = html => [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]).sort();
  assert.deepEqual(ids(built), ids(original), `UI elements changed: ${name}`);
  assert.ok(!built.includes('type="importmap"'), 'Build must resolve bare imports');
}
assert.ok(files.get('index.html').toString().includes('href="./film.html"'));
assert.ok(files.get('film.html').toString().includes('href="./"'));
assert.deepEqual(files.get('assets/campus-score.mp3'), await readFile(new URL('assets/campus-score.mp3', source)));
for (const name of ['student.glb', 'film-labels.otf']) {
  const original = await readFile(new URL(`assets/${name}`, source));
  const matches = [...files].filter(([path]) => path.endsWith(extname(name)));
  assert.ok(matches.some(([, data]) => data.equals(original)), `Asset changed or missing: ${name}`);
}

// Read generated references, then request them through a real static HTTP server
// both at the domain root and below an arbitrary GitHub repository prefix.
const references = new Set([...files.keys(), 'assets/campus-score.mp3?v=9']);
for (const [name, data] of files) {
  if (!/\.(html|css|js)$/.test(name)) continue;
  const text = data.toString();
  let urls = [];
  if (name.endsWith('.html')) urls = [...text.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  if (name.endsWith('.css')) urls = [...text.matchAll(/url\((?:["']?)([^)"']+)/g)].map(m => m[1]);
  if (name.endsWith('.js')) urls = [...text.matchAll(/["'](\.[^"'\s]+\.(?:js|css|glb|otf|mp3)(?:\?[^"']*)?)["']/g)].map(m => m[1]);
  for (const url of urls) {
    if (/^(?:https?:|data:|#)/.test(url)) continue;
    assert.ok(!url.startsWith('/'), `Domain-absolute resource URL: ${name} -> ${url}`);
    // The original music URL is relative to the document, not to its JS bundle.
    const directory = url.startsWith('./assets/') && url.includes('.mp3') ? '' : posix.dirname(name);
    const resolved = posix.normalize(posix.join(directory, url)).replace(/^\.\//, '');
    if (resolved === '.' || resolved === '') continue;
    assert.ok(files.has(resolved.split(/[?#]/)[0]), `Broken resource: ${name} -> ${url}`);
    references.add(resolved);
  }
}
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.glb': 'model/gltf-binary', '.mp3': 'audio/mpeg', '.otf': 'font/otf', '.txt': 'text/plain' };
let prefix = '/';
const server = createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  if (!pathname.startsWith(prefix)) { res.writeHead(404); res.end(); return; }
  const name = pathname.slice(prefix.length) || 'index.html';
  const data = files.get(name);
  res.writeHead(data ? 200 : 404, { 'Content-Type': mime[extname(name)] || 'application/octet-stream' });
  res.end(data);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
try {
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (prefix of ['/', '/eduhk-campus-path-check/']) {
    for (const path of references) {
      const response = await fetch(`${origin}${prefix}${path}`);
      assert.equal(response.status, 200, `${prefix}${path}`);
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), files.get(path.split(/[?#]/)[0]));
    }
  }
} finally {
  await new Promise(resolve => server.close(resolve));
}
console.log(`PASS: both page entries, UI IDs, GLB, font and unchanged music; ${references.size} URLs load at / and /eduhk-campus-path-check/.`);

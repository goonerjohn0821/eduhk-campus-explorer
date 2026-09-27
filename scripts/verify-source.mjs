import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SHOTS, FILM_DURATION, PHOTO_TIME } from '../source/dist/film-sequences.js';

const project = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('source-manifest.json', project), 'utf8'));
for (const { path, sha256 } of manifest.files) {
  const data = await readFile(new URL(`source/${path}`, project));
  assert.equal(createHash('sha256').update(data).digest('hex'), sha256, `Original file changed: ${path}`);
}
assert.equal(FILM_DURATION, 90);
assert.equal(SHOTS.length, 14);
let end = 0;
for (const shot of SHOTS) {
  assert.ok(Math.abs(shot.startTime - end) < 1e-7, `Timeline gap: ${shot.id}`);
  end = shot.startTime + shot.duration;
}
assert.ok(Math.abs(end - 90) < 1e-7);
assert.equal(PHOTO_TIME, 86.7);
console.log(`PASS: ${manifest.files.length} original files are byte-identical; 14 shots cover exactly 90 seconds.`);

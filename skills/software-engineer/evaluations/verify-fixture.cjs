'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const fixture = path.join(__dirname, 'fixtures', 'issue-repo');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-engineer-fixture-'));
try {
  fs.cpSync(fixture, temporary, { recursive: true });
  const run = () => spawnSync(process.execPath, ['check-slug.cjs'], {
    cwd: temporary,
    encoding: 'utf8',
    timeout: 10000,
  });
  const before = run();
  assert.equal(before.error, undefined);
  assert.equal(before.status, 1, 'Fixture must reproduce an assertion failure');
  assert.match(before.stderr, /AssertionError/);
  assert.match(before.stderr, /hello----world-/);

  fs.writeFileSync(path.join(temporary, 'slug.js'), [
    "'use strict';",
    'function slug(value) {',
    "  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');",
    '}',
    'module.exports = { slug };',
    '',
  ].join('\n'));
  const after = run();
  assert.equal(after.error, undefined);
  assert.equal(after.status, 0, after.stderr);
  process.stdout.write('Fixture verified: baseline reproduces; reference correction passes. No agent or live GitHub evaluation performed.\n');
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}

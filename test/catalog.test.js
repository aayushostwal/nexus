'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nexus-catalog-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, body) => { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), body); };
  write('scripts/generate-catalog.js', fs.readFileSync(path.join(__dirname, '../scripts/generate-catalog.js')));
  write('.claude-plugin/plugin.json', JSON.stringify({ name: 'nexus', version: '2.0.0' }));
  write('skills/debugging/SKILL.md', '---\nname: debugging\ndescription: >\n  Debug a failure\n  using evidence.\n---\n');
  write('agents/reviewer.md', '---\nname: reviewer\ndescription: Review changes\nmemory: project\ncolor: blue\n---\n');
  write('commands/commit-message.md', '---\ndescription: Draft a commit message\n---\n');
  write('README.md', '# User-authored introduction\n<!-- catalog:start -->\nold\n<!-- catalog:end -->\nRetain this footer.\n');
  write('apps/nexus-web/content/docs/getting-started/quickstart.mdx', '# Quickstart\n{/* catalog:start */}\nold\n{/* catalog:end */}\n');
  const run = (...args) => spawnSync(process.execPath, [path.join(root, 'scripts/generate-catalog.js'), ...args], { encoding: 'utf8' });
  return { root, write, run };
}

test('catalog generation reflects source inventory and preserves authored docs; check detects later drift', t => {
  const { root, write, run } = fixture(t);
  assert.equal(run('--check').status, 1);
  assert.equal(fs.existsSync(path.join(root, 'catalog')), false, 'check mode must not write');
  assert.equal(run().status, 0);
  assert.equal(run('--check').status, 0);
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog/generated.json'), 'utf8'));
  assert.equal(catalog.version, '2.0.0');
  assert.equal(catalog.skills[0].description, 'Debug a failure using evidence.');
  assert.equal(catalog.commands[0].invocation, '/nexus:commit-message');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  assert.ok(readme.startsWith('# User-authored introduction\n'));
  assert.ok(readme.endsWith('Retain this footer.\n'));
  write('skills/new-workflow/SKILL.md', '---\nname: new-workflow\ndescription: A new workflow\n---\n');
  const stale = run('--check');
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /Stale generated content/);
  assert.equal(run().status, 0);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'catalog/generated.json'))).skills.length, 2);
});

test('catalog generation rejects missing descriptions and missing managed markers', t => {
  const { write, run } = fixture(t);
  write('commands/commit-message.md', '# Missing metadata\n');
  assert.match(run().stderr, /Missing description/);
  write('commands/commit-message.md', '---\ndescription: Draft a message\n---\n');
  write('README.md', '# No markers\n');
  assert.match(run().stderr, /Missing catalog markers/);
});

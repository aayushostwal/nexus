'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {validate} = require('../scripts/validate-content');
function fixture(t) {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'nexus-content-'));
  t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
  const write=(file,body)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),body);};
  for(const dir of ['.claude-plugin','.codex-plugin']) write(`${dir}/plugin.json`,JSON.stringify({name:'nexus',version:'1.0.0',description:'Workflows'}));
  for(const dir of ['.claude-plugin','.agents/plugins']) write(`${dir}/marketplace.json`,JSON.stringify({name:'nexus-marketplace',version:'1.0.0',plugins:[{name:'nexus',version:'1.0.0',source:'./'}]}));
  write('skills/debugging/SKILL.md','---\nname: debugging\ndescription: >\n  Diagnose reproducible failures.\n---\nRead `checklists/check.md`.\n');
  write('skills/debugging/checklists/check.md','# Check\n');
  return {root,write};
}
test('valid fixture includes folded description and existing support file',t=>{const {root}=fixture(t);assert.deepEqual(validate(root),[]);});
test('rejects name drift and missing referenced support file',t=>{const {root,write}=fixture(t);write('skills/debugging/SKILL.md','---\nname: nexus-debugging\ndescription: Debug failures\n---\nRead `missing.md`.\n');const errors=validate(root);assert.ok(errors.some(e=>e.includes('containing directory')));assert.ok(errors.some(e=>e.includes('missing.md')));});
test('rejects malformed metadata and marketplace version drift',t=>{const {root,write}=fixture(t);write('skills/debugging/SKILL.md','---\nname: debugging\ndescription:\n---\n');write('.agents/plugins/marketplace.json',JSON.stringify({name:'market',version:'1.0.0',plugins:[{name:'nexus',source:'./',version:'2.0.0'}]}));const errors=validate(root);assert.ok(errors.some(e=>e.includes('description')));assert.ok(errors.some(e=>e.includes('versions must match')));});
test('checks quickstart against shipped commands and skills',t=>{const {root,write}=fixture(t);write('commands/commit-message.md','# Commit\n');write('apps/nexus-web/content/docs/getting-started/quickstart.mdx','/nexus:debugging /nexus:commit-message /nexus:removed');assert.deepEqual(validate(root),['apps/nexus-web/content/docs/getting-started/quickstart.mdx: unshipped invocation /nexus:removed']);});
test('ignores remote links and user-owned runtime documents',t=>{const {root,write}=fixture(t);write('skills/debugging/checklists/check.md','Read `~/.nexus/TODOS.md` and [external](https://example.com/file.md).');assert.deepEqual(validate(root),[]);});
test('rejects malformed manifests and absent local plugin sources',t=>{const {root,write}=fixture(t);write('.codex-plugin/plugin.json','{bad json');write('.agents/plugins/marketplace.json',JSON.stringify({name:'market',version:'1.0.0',plugins:[{name:'nexus',version:'1.0.0',source:{source:'local',path:'./missing'}}]}));const errors=validate(root);assert.ok(errors.some(e=>e.startsWith('.codex-plugin/plugin.json:')));assert.ok(errors.some(e=>e.includes('local plugin source must exist')));});
test('rejects empty and excessive descriptions',t=>{const {root,write}=fixture(t);write('skills/debugging/SKILL.md',`---\nname: debugging\ndescription: ${'x'.repeat(1025)}\n---\n`);assert.ok(validate(root).some(e=>e.includes('1–1024')));});
test('supports quoted scalar metadata and rejects quoted empty description',t=>{const {root,write}=fixture(t);write('skills/debugging/SKILL.md','---\nname: "debugging"\ndescription: "Diagnose failures"\n---\n');assert.deepEqual(validate(root),[]);write('skills/debugging/SKILL.md',"---\nname: 'debugging'\ndescription: ''\n---\n");assert.ok(validate(root).some(e=>e.includes('description')));});

#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const MANIFESTS = ['.claude-plugin/plugin.json', '.codex-plugin/plugin.json', '.claude-plugin/marketplace.json', '.agents/plugins/marketplace.json'];
function files(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(path.join(dir,e.name),suffix) : e.name.endsWith(suffix) ? [path.join(dir,e.name)] : []);
}
function scalar(value) {
  const trimmed = (value || '').trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return trimmed.slice(1,-1);
  return trimmed;
}
function validate(root) {
  const errors = [];
  const fail = (file, message) => errors.push(`${path.relative(root,file)}: ${message}`);
  const versions = new Set();
  for (const relative of MANIFESTS) {
    const file = path.join(root,relative);
    try {
      const value = JSON.parse(fs.readFileSync(file,'utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('expected object');
      if (typeof value.name !== 'string' || !value.name.trim()) fail(file,'name is required');
      if (!/^\d+\.\d+\.\d+$/.test(value.version)) fail(file,'version must be stable major.minor.patch');
      versions.add(value.version);
      if (relative.endsWith('marketplace.json')) {
        if (!Array.isArray(value.plugins) || !value.plugins.length) fail(file,'plugins must be a nonempty array');
        else for (const plugin of value.plugins) {
          if (plugin.name !== 'nexus') fail(file,'expected nexus plugin');
          versions.add(plugin.version);
          const local = typeof plugin.source === 'string' ? plugin.source : plugin.source?.source === 'local' ? plugin.source.path : null;
          if (typeof local !== 'string' || !fs.existsSync(path.resolve(root,local))) fail(file,'local plugin source must exist');
        }
      } else if (typeof value.description !== 'string' || !value.description.trim()) fail(file,'description is required');
    } catch (error) { fail(file,error.message); }
  }
  if (versions.size !== 1) errors.push('manifest versions must match, including marketplace entries');
  const skillFiles = files(path.join(root,'skills'),'SKILL.md');
  if (!skillFiles.length) errors.push('at least one skill is required');
  const names = new Set();
  for (const file of skillFiles) {
    const source = fs.readFileSync(file,'utf8');
    const front = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1];
    if (!front) { fail(file,'YAML frontmatter is required'); continue; }
    const name = scalar(front.match(/^name:[ \t]*(.+)$/m)?.[1]);
    const raw = front.match(/^description:[ \t]*(.*)((?:\r?\n[ \t]+.*)*)/m);
    const description = raw ? (raw[1].match(/^[>|][-+]?$/) ? raw[2].trim() : scalar(raw[1])).replace(/\s+/g,' ') : '';
    if (!name || name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) fail(file,'name must be lowercase kebab-case, at most 64 characters');
    if (name !== path.basename(path.dirname(file))) fail(file,'name must match containing directory');
    if (names.has(name)) fail(file,'duplicate skill name');
    names.add(name);
    if (!description || description.length > 1024) fail(file,'description must contain 1–1024 characters');
    // Only executable supporting-file references, not example directory layouts or user files.
    for (const markdown of files(path.dirname(file),'.md')) {
      if (name === 'skill-writer') continue; // This skill documents hypothetical output files.
      const body = fs.readFileSync(markdown,'utf8').replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
      const references = [...body.matchAll(/`((?:skills\/|\.\.?\/|checklists\/|validation\/|examples\/|heuristics\/|anti-patterns\/)[^`\s]+\.md|[a-z][a-z0-9-]*\.md)`/g)].map(m=>m[1]);
      for (const ref of new Set(references)) {
        const candidates = ref.startsWith('skills/') ? [path.join(root,ref)] : [path.resolve(path.dirname(markdown),ref),path.resolve(path.dirname(file),ref)];
        if (!candidates.some(p=>fs.existsSync(p))) fail(markdown,`missing supporting file ${ref}`);
      }
      for (const match of body.matchAll(/\[[^\]]*\]\(([^\s)]+\.md)(?:#[^)]*)?\)/g)) {
        const ref = match[1];
        if (/^(?:https?:|~\/)/.test(ref)) continue;
        if (!fs.existsSync(path.resolve(path.dirname(markdown),ref))) fail(markdown,`missing Markdown link ${ref}`);
      }
    }
  }
  const commands = new Set(files(path.join(root,'commands'),'.md').map(p=>path.basename(p,'.md')));
  const quickstart = path.join(root,'apps/nexus-web/content/docs/getting-started/quickstart.mdx');
  if (fs.existsSync(quickstart)) for (const match of fs.readFileSync(quickstart,'utf8').matchAll(/\/nexus:([a-z0-9-]+)/g)) {
    if (!commands.has(match[1]) && !names.has(match[1])) fail(quickstart,`unshipped invocation /nexus:${match[1]}`);
  }
  return errors;
}
if (require.main === module) {
  const errors = validate(path.resolve(__dirname,'..'));
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Content valid: manifests, skill metadata, supporting files, and quickstart invocations.');
}
module.exports = {validate};

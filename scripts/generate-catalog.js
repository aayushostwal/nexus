#!/usr/bin/env node
'use strict';
// Dependency-free catalog generation. Source files, not website metadata, own identity.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
function frontmatter(source) {
  const header = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const result = {};
  if (!header) return result;
  const lines = header[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^([\w-]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2];
    if (/^[>|][-+]?$/.test(value)) {
      const parts = [];
      while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) parts.push(lines[++i].trim());
      value = parts.join(' ');
    }
    result[match[1]] = value.replace(/^(['"])(.*)\1$/, '$2');
  }
  return result;
}
function entries(directory, skills = false) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true })
    .filter(entry => skills ? entry.isDirectory() && fs.existsSync(path.join(root, directory, entry.name, 'SKILL.md')) : entry.isFile() && entry.name.endsWith('.md'))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'))
    .map(entry => {
      const file = `${directory}/${entry.name}${skills ? '/SKILL.md' : ''}`;
      const source = read(file);
      const metadata = frontmatter(source);
      const name = skills ? entry.name : entry.name.replace(/\.md$/, '');
      const description = metadata.description || source.match(/\*\*Purpose:\*\*\s*([^\n]+)/)?.[1];
      if (!description) throw new Error(`Missing description: ${file}`);
      return { name, description, path: file, invocation: directory === 'agents' ? null : `/nexus:${name}`,
        ...(directory === 'agents' ? { color: metadata.color || 'green', memory: metadata.memory || null, tools: metadata.tools || 'Inherited from host' } : {}) };
    });
}
function buildCatalog() {
  const manifest = JSON.parse(read('.claude-plugin/plugin.json'));
  return { schemaVersion: 1, name: manifest.name, version: manifest.version,
    skills: entries('skills', true), agents: entries('agents'), commands: entries('commands') };
}
function catalogMarkdown(catalog, web) {
  const prefix = web ? 'https://github.com/aayushostwal/nexus/blob/main/' : '';
  return `Version **${catalog.version}** includes **${catalog.skills.length} skills**, **${catalog.agents.length} Claude agents**, and **${catalog.commands.length} commands**.\n\n` +
    ['skills', 'agents', 'commands'].map(kind => `### ${kind[0].toUpperCase() + kind.slice(1)}\n\n| ${kind === 'agents' ? 'Agent' : 'Claude invocation'} | Source |\n| --- | --- |\n` + catalog[kind].map(item => `| \`${item.invocation || item.name}\` | [${item.name}](${prefix}${item.path}) |`).join('\n')).join('\n\n');
}
function generate(check = false) {
  const catalog = buildCatalog();
  const outputs = new Map([['catalog/generated.json', JSON.stringify(catalog, null, 2) + '\n']]);
  for (const [file, web] of [['README.md', false], ['apps/nexus-web/content/docs/getting-started/quickstart.mdx', true]]) {
    const source = read(file);
    const start = web ? '{/* catalog:start */}' : '<!-- catalog:start -->';
    const end = web ? '{/* catalog:end */}' : '<!-- catalog:end -->';
    if (!source.includes(start) || !source.includes(end)) throw new Error(`Missing catalog markers: ${file}`);
    outputs.set(file, source.slice(0, source.indexOf(start) + start.length) + '\n\n' + catalogMarkdown(catalog, web) + '\n\n' + source.slice(source.indexOf(end)));
  }
  let stale = false;
  for (const [file, content] of outputs) {
    if (fs.existsSync(path.join(root, file)) && read(file) === content) continue;
    if (check) { console.error(`Stale generated content: ${file}; run node scripts/generate-catalog.js`); stale = true; }
    else { fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true }); fs.writeFileSync(path.join(root, file), content); }
  }
  return !stale;
}
if (require.main === module) {
  if (process.argv.slice(2).some(arg => arg !== '--check')) { console.error('Usage: node scripts/generate-catalog.js [--check]'); process.exitCode = 1; }
  else if (!generate(process.argv.includes('--check'))) process.exitCode = 1;
}
module.exports = { buildCatalog, frontmatter, generate };

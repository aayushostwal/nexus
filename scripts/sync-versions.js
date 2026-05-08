#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const version = process.argv[2] || require("../package.json").version;
const files = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
];

for (const file of files) {
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  json.version = version;
  if (Array.isArray(json.plugins)) {
    for (const plugin of json.plugins) {
      if (plugin.name === "nexus") {
        plugin.version = version;
      }
    }
  }
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
}

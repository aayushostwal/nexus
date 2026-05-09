#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const packageJsonPath = "package.json";
const files = [
  ".agents/plugins/marketplace.json",
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
];

function syncVersions(version = readPackageVersion()) {
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

  return version;
}

function readPackageVersion() {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  const version = packageJson.version;
  if (!/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error(`package.json version must be semver-like: ${version}`);
  }
  return version;
}

if (require.main === module) {
  console.log(syncVersions(process.argv[2]));
}

module.exports = { syncVersions, readPackageVersion };

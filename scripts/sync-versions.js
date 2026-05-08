#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const packageJsonPath = "package.json";
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const version = process.argv[2] || deriveVersion(packageJson.version, readVersionCounter());
const files = [
  ".codex-plugin/plugin.json",
  ".claude-plugin/plugin.json",
  ".claude-plugin/marketplace.json",
];

packageJson.version = version;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

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

console.log(version);

function readVersionCounter() {
  const raw = fs.readFileSync("VERSION", "utf8").trim();
  if (!/^\d+$/.test(raw)) {
    throw new Error("VERSION must contain a positive integer minor version.");
  }
  return Number.parseInt(raw, 10);
}

function deriveVersion(packageVersion, minor) {
  const match = packageVersion.match(/^(\d+)\./);
  if (!match) {
    throw new Error(`package.json version must be semver-like: ${packageVersion}`);
  }
  return `${match[1]}.${minor}.0`;
}

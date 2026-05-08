#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, ".codex-plugin", "plugin.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

const requiredTopLevel = ["name", "version", "description", "author", "homepage", "repository", "license", "skills", "interface"];
const requiredInterface = [
  "displayName",
  "shortDescription",
  "longDescription",
  "developerName",
  "category",
  "capabilities",
  "websiteURL",
  "defaultPrompt",
  "brandColor",
];

for (const field of requiredTopLevel) {
  assertPresent(manifest, field, `Missing top-level field: ${field}`);
}

for (const field of requiredInterface) {
  assertPresent(manifest.interface, field, `Missing interface field: ${field}`);
}

assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(manifest.name), "Plugin name must be kebab-case.");
assert(/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(manifest.version), "Plugin version must be semver-like.");
assertRelativePath(manifest.skills, "skills");

if (manifest.interface.defaultPrompt.length > 3) {
  throw new Error("interface.defaultPrompt must contain at most 3 entries.");
}

for (const prompt of manifest.interface.defaultPrompt) {
  assert(typeof prompt === "string", "Each default prompt must be a string.");
  assert(prompt.length <= 128, "Each default prompt must be 128 characters or less.");
}

console.log("Codex plugin manifest valid");

function assertPresent(object, field, message) {
  assert(Object.prototype.hasOwnProperty.call(object, field), message);
}

function assertRelativePath(value, field) {
  assert(typeof value === "string", `${field} must be a string.`);
  assert(value.startsWith("./"), `${field} must be a relative path starting with ./`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

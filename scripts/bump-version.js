#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const packageJsonPath = "package.json";
const packageLockPath = "package-lock.json";

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const nextVersion = bumpMinor(packageJson.version);

packageJson.version = nextVersion;
fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

if (fs.existsSync(packageLockPath)) {
  const packageLock = JSON.parse(fs.readFileSync(packageLockPath, "utf8"));
  packageLock.version = nextVersion;
  if (packageLock.packages && packageLock.packages[""]) {
    packageLock.packages[""].version = nextVersion;
  }
  fs.writeFileSync(packageLockPath, `${JSON.stringify(packageLock, null, 2)}\n`);
}

console.log(nextVersion);

function bumpMinor(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`package.json version must be x.y.z: ${version}`);
  }

  const major = Number.parseInt(match[1], 10);
  const minor = Number.parseInt(match[2], 10) + 1;
  return `${major}.${minor}.0`;
}

#!/usr/bin/env node
"use strict";

const fs = require("node:fs");

const versionFile = "VERSION";
const raw = fs.readFileSync(versionFile, "utf8").trim();

if (!/^\d+$/.test(raw)) {
  throw new Error("VERSION must contain a positive integer minor version.");
}

const next = Number.parseInt(raw, 10) + 1;
fs.writeFileSync(versionFile, `${next}\n`);
console.log(next);

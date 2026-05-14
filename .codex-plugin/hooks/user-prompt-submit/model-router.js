#!/usr/bin/env node
"use strict";

const { run } = require("../../../scripts/run-model-router-hook");

run("codex").catch(() => process.exit(0));

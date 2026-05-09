"use strict";

const { syncVersions } = require("./sync-versions");

module.exports = {
  prepare: async (_pluginConfig, context) => {
    syncVersions(context.nextRelease.version);
  },
};

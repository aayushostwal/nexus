'use strict';

// Fixture defect: punctuation runs produce repeated separators.
function slug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
}

module.exports = { slug };

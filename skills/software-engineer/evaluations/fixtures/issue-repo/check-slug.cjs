'use strict';

const assert = require('node:assert/strict');
const { slug } = require('./slug');

assert.equal(slug('Hello world'), 'hello-world');
assert.equal(slug('  Hello,   world!  '), 'hello-world');
assert.equal(slug('---'), '');
assert.equal(slug('V2 release'), 'v2-release');

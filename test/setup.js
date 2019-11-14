'use strict';

const del = require('del');
const { mkdirSync } = require('fs');
const path = require('path');

module.exports = () => {
  const tempDir = path.join(__dirname, '.tmp');
  process.env.TEMP_DIR = tempDir;
  del.sync(tempDir);
  mkdirSync(tempDir);
};

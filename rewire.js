'use strict';

const fs = require('fs');
const rewire = require('rewire');

module.exports = modulePath => {
  modulePath = require.resolve(modulePath);
  const { readFileSync } = fs;
  fs.readFileSync = function (path, options) {
    if (path !== modulePath) return readFileSync(path, options);
    const code = readFileSync(path, options);
    // Remove shebang.
    return code.replace(/^#!(.*?)\n/g, '');
  };
  const result = rewire(modulePath);
  fs.readFileSync = readFileSync;
  return result;
};

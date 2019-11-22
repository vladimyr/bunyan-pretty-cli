'use strict';

const fs = require('fs');

module.exports = (modulePath, transform) => {
  modulePath = require.resolve(modulePath);
  const { readFileSync } = fs;
  fs.readFileSync = function (path, options) {
    if (path !== modulePath) return readFileSync(path, options);
    return transform(readFileSync(path, 'utf-8'));
  };
  const result = require(modulePath);
  fs.readFileSync = readFileSync;
  return result;
};

'use strict';

const dedent = require('dedent');
const bunyan = require('./rewire')('bunyan/bin/bunyan', code => {
  return code
    // Remove shebang.
    .replace(/^#!(.*?)\n/g, '')
    // Modify `parseArgv(argv)` method.
    .replace(
      /function\s+parseArgv\s*\(\s*argv\s*\)\s*{\s*var\s+parsed\s*=/m,
      dedent`
        function parseArgv(argv) {
          var parsed = { args: [] };
          parsed._defaults =
      `
    );
});

const getter = (proxiedModule, name) => ({
  get: () => proxiedModule.__get__(name)
});

const prop = (proxiedModule, name) => ({
  ...getter(proxiedModule, name),
  set: val => proxiedModule.__set__(name, val)
});

module.exports = Object.defineProperties({}, {
  emit: prop(bunyan, 'emit'),
  emitRecord: prop(bunyan, 'emitRecord'),
  indent: getter(bunyan, 'indent'),
  isValidRecord: getter(bunyan, 'isValidRecord'),
  levelFromName: getter(bunyan, 'levelFromName'),
  main: getter(bunyan, 'main'),
  OM_FROM_NAME: getter(bunyan, 'OM_FROM_NAME'),
  OM_LONG: getter(bunyan, 'OM_LONG'),
  OM_SHORT: getter(bunyan, 'OM_SHORT'),
  parseArgv: prop(bunyan, 'parseArgv'),
  print: prop(bunyan, 'p'),
  printHelp: prop(bunyan, 'printHelp')
});

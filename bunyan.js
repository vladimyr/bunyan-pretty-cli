'use strict';

const dedent = require('dedent');
const bunyan = require('./rewire')('bunyan/bin/bunyan', code => {
  // Remove shebang.
  code = code.replace(/^#!(.*?)\n/g, '');

  // Modify `parseArgv(argv)` method.
  code = code.replace(
    /function\s+parseArgv\s*\(\s*argv\s*\)\s*{\s*var\s+parsed\s*=/m,
    dedent`
      function parseArgv(argv) {
        var parsed = { args: [] };
        parsed._defaults =
    `
  );

  // Simplified versions of injected `rewire` getter/setter.
  code += dedent`
    \n;var format = require('util').format;

    exports.__set__ = function () {
      arguments.varName = arguments[0];
      arguments.varValue = arguments[1];
      return eval(format('%s = arguments.varValue;', arguments.varName));
    };

    exports.__get__ = function () {
      arguments.varName = arguments[0];
      return eval(arguments.varName);
    };
  `;

  return code;
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

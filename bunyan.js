'use strict';

const bunyan = require('./rewire')('bunyan/bin/bunyan', code => {
  // Remove shebang.
  return code.replace(/^#!(.*?)\n/g, '');
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

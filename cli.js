#!/usr/bin/env node

'use strict';

const args = require('minimist')(process.argv.slice(2));
const bunyan = require('rewire')('bunyan/bin/bunyan');
const dargs = require('dargs');
const dedent = require('dedent');
const JoyCon = require('joycon');
const path = require('path');
const { readFileSync } = require('fs');
const stripJsonComments = require('strip-json-comments');

const isFunction = arg => typeof arg === 'function';
const isObject = arg => arg !== null && typeof arg === 'object';

const parseJSON = input => JSON.parse(stripJsonComments(input));
const joycon = new JoyCon({
  parseJSON,
  files: [
    'bunyan-pretty.config.js',
    '.bunyan-prettyrc',
    '.bunyan-prettyrc.json'
  ],
  stopDir: path.dirname(process.cwd())
});
joycon.addLoader({
  test: /\.[^.]*rc$/,
  loadSync: path => parseJSON(readFileSync(path, 'utf-8'))
});

const OM_LONG = bunyan.__get__('OM_LONG');
const OM_SHORT = bunyan.__get__('OM_SHORT');
const OM_FROM_NAME = bunyan.__get__('OM_FROM_NAME');
const levelFromName = bunyan.__get__('levelFromName');

const indent = bunyan.__get__('indent');
const isValidRecord = bunyan.__get__('isValidRecord');
const emit = bunyan.__get__('emit');
const print = bunyan.__get__('p');

const _emitRecord = bunyan.__get__('emitRecord');
const _parseArgv = bunyan.__get__('parseArgv');
const _printHelp = bunyan.__get__('printHelp');
bunyan.__set__('emitRecord', emitRecord);
bunyan.__set__('parseArgv', parseArgv);
bunyan.__set__('printHelp', printHelp);

main(args);

function main({ config, ...args }) {
  const argv = process.argv.slice(0);
  argv.length = 2;
  argv.push(...dargs(args));
  bunyan.__get__('main')(argv);
}

function parseArgv(input) {
  const options = _parseArgv.call(this, input);
  const config = loadConfig(args.config);
  if (config.level) config.level = levelFromName[config.level];
  if (config.outputMode) config.outputMode = OM_FROM_NAME[config.outputMode];
  return Object.assign(options, config);
}

function printHelp() {
  let help = '';
  bunyan.__set__('p', input => (help += '\n' + input));
  _printHelp.call(this);
  help = help.trimLeft();
  help = help.replace(/General options:/, header => dedent`
    ${header}
      --config      specify path to config file containing bunyan-pretty
                    options. bunyan-pretty will atempt to read from a
                    \`.bunyan-prettyrc\` in current working directory if
                    not specified
  `);
  help = help.replace(/bunyan(\s)/g, 'bunyan-pretty$1');
  bunyan.__set__('p', print);
  print(help);
}

function emitRecord(record, line, options, stylize) {
  const { outputMode, customPrettifiers = {} } = options;
  if (![OM_LONG, OM_SHORT].includes(outputMode) || !isValidRecord(record)) {
    return _emitRecord.apply(this, arguments);
  }
  const extras = [];
  const newRecord = Object.entries(record).reduce((acc, [key, value]) => {
    const customPrettifier = customPrettifiers[key];
    if (!isFunction(customPrettifier)) {
      return Object.assign(acc, { [key]: value });
    }
    extras.push(indent(`${key}: ${customPrettifier(value, key, record)}`));
    return acc;
  }, {});
  bunyan.__set__('emit', input => emit(input + extras.join('\n') + '\n'));
  const result = _emitRecord.call(this, newRecord, line, options, stylize);
  bunyan.__set__('emit', emit);
  return result;
}

function loadConfig(configPath) {
  const files = configPath ? [path.resolve(configPath)] : undefined;
  const result = joycon.loadSync(files);
  if (result.path && !isObject(result.data)) {
    configPath = configPath || path.basename(result.path);
    throw new Error(`Invalid runtime configuration file: ${configPath}`);
  }
  if (configPath && !result.data) {
    throw new Error(`Failed to load runtime configuration file: ${configPath}`);
  }
  return result.data;
}

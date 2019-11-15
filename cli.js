#!/usr/bin/env node

'use strict';

const args = require('minimist')(process.argv.slice(2));
const bunyan = require('./bunyan');
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

const { emitRecord: _emitRecord } = bunyan;
bunyan.emitRecord = emitRecord;

const { parseArgv: _parseArgv } = bunyan;
bunyan.parseArgv = parseArgv;

const { printHelp: _printHelp } = bunyan;
bunyan.printHelp = printHelp;

main(args);

function main({ config, ...args }) {
  const argv = process.argv.slice(0);
  argv.length = 2;
  argv.push(...dargs(args, { useEquals: false }));
  bunyan.main(argv);
}

function parseArgv(input) {
  const { levelFromName, OM_FROM_NAME } = bunyan;
  const { _defaults: defaultOptions, ...options } = _parseArgv.call(this, input);
  const config = loadConfig(args.config);
  if (config.level) config.level = levelFromName[config.level.toLowerCase()];
  if (config.outputMode) config.outputMode = OM_FROM_NAME[config.outputMode];
  return Object.assign({}, defaultOptions, config, options);
}

function printHelp() {
  let help = '';
  const { print: _print } = bunyan;
  bunyan.print = input => (help += '\n' + input);
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
  bunyan.print = _print;
  _print(help);
}

function emitRecord(record, line, options, stylize) {
  const { emit: _emit, indent, isValidRecord, OM_LONG, OM_SHORT } = bunyan;
  const { outputMode, customPrettifiers = {} } = options;
  if (![OM_LONG, OM_SHORT].includes(outputMode) || !isValidRecord(record)) {
    return _emitRecord.apply(this, arguments);
  }
  let extras = '';
  const newRecord = Object.entries(record).reduce((acc, [key, value]) => {
    const customPrettifier = customPrettifiers[key];
    if (!isFunction(customPrettifier)) {
      return Object.assign(acc, { [key]: value });
    }
    extras += indent(`${key}: ${customPrettifier(value, key, record)}`) + '\n';
    return acc;
  }, {});
  bunyan.emit = input => _emit(input + extras);
  const result = _emitRecord.call(this, newRecord, line, options, stylize);
  bunyan.emit = _emit;
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
  return result.data || {};
}

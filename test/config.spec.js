'use strict';

/* eslint-env jest */

const { mkdirSync, writeFileSync } = require('fs');
const cli = require.resolve('../cli');
const crypto = require('crypto');
const del = require('del');
const execa = require('execa');
const path = require('path');

const md5 = input => crypto.createHash('md5').update(input).digest('base64');

const LOG_LINE = '{"name":"test","hostname":"localhost","pid":85421,"level":20,"msg":"hello world","time":"2019-11-03T21:07:47.064Z","v":0}\n';

let configFile;
const tempDir = path.join(process.env.TEMP_DIR, 'data_' + md5(__filename));

mkdirSync(tempDir);

afterEach(() => del(configFile));

test('loads and applies default config file: bunyan-pretty.config.js', () => {
  configFile = path.join(tempDir, 'bunyan-pretty.config.js');
  writeFileSync(configFile, 'module.exports = { outputMode: \'short\' };');
  const proc = execa(process.argv0, [cli], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('loads and applies default config file: .bunyan-prettyrc', () => {
  configFile = path.join(tempDir, '.bunyan-prettyrc');
  writeFileSync(configFile, '{ "outputMode": "short" }');
  const proc = execa(process.argv0, [cli], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('loads and applies default config file: .bunyan-prettyrc.json', () => {
  configFile = path.join(tempDir, '.bunyan-prettyrc.json');
  writeFileSync(configFile, '{ "outputMode": "short" }');
  const proc = execa(process.argv0, [cli], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('loads and applies custom config file: bunyan-pretty.test.json', () => {
  configFile = path.join(tempDir, 'bunyan-pretty.test.json');
  writeFileSync(configFile, '{ "outputMode": "short" }');
  const proc = execa(process.argv0, [cli, '--config', configFile], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('loads and applies custom config file: bunyan-pretty.test.js', () => {
  configFile = path.join(tempDir, 'bunyan-pretty.test.js');
  writeFileSync(configFile, 'module.exports = { outputMode: \'short\' };');
  const proc = execa(process.argv0, [cli, '--config', configFile], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('cli options override config options', () => {
  configFile = path.join(tempDir, 'bunyan-pretty.config.js');
  writeFileSync(configFile, 'module.exports = { outputMode: \'long\' };');
  const proc = execa(process.argv0, [cli, '--output', 'short'], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe('21:07:47.064Z DEBUG test: hello world');
  });
});

test('throws on missing config file', async () => {
  const args = [cli, '--config', 'bunyan-pretty.config.missing.js'];
  const { stderr } = await execa(process.argv0, args, { cwd: tempDir, reject: false });
  expect(stderr).toBe('bunyan: error: Failed to load runtime configuration file: bunyan-pretty.config.missing.js');
});

test('throws on invalid default config file', async () => {
  configFile = path.join(tempDir, 'bunyan-pretty.config.js');
  writeFileSync(configFile, 'module.exports = () => {};');
  const args = [cli, '--config', path.relative(tempDir, configFile)];
  const { stderr } = await execa(process.argv0, args, { cwd: tempDir, reject: false });
  expect(stderr).toBe('bunyan: error: Invalid runtime configuration file: bunyan-pretty.config.js');
});

test('throws on invalid custom config file', async () => {
  configFile = path.join(tempDir, 'bunyan-pretty.config.invalid.js');
  writeFileSync(configFile, 'module.exports = () => {};');
  const args = [cli, '--config', path.relative(tempDir, configFile)];
  const { stderr } = await execa(process.argv0, args, { cwd: tempDir, reject: false });
  expect(stderr).toBe('bunyan: error: Invalid runtime configuration file: bunyan-pretty.config.invalid.js');
});

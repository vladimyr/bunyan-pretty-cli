'use strict';

/* eslint-env jest */

const { mkdirSync, readFileSync, writeFileSync } = require('fs');
const cli = require.resolve('../cli');
const dedent = require('dedent');
const del = require('del');
const execa = require('execa');
const path = require('path');

const LOG_LINE = '{"name":"test","hostname":"localhost","pid":85421,"level":20,"foo":"bar","cow":"moo","msg":"hello world","time":"2019-11-03T21:07:47.064Z","v":0}\n';

const tempDir = path.join(__dirname, '.tmp_' + Date.now());
const source = path.join(__dirname, './fixtures/bunyan-pretty.config.js');
const dest = path.join(tempDir, 'bunyan-pretty.config.js');

mkdirSync(tempDir);
writeFileSync(dest, readFileSync(source));

afterAll(() => del.sync(tempDir));

test('prettifies custom keys', () => {
  const proc = execa(process.argv0, [cli], { cwd: tempDir });
  proc.stdout.once('data', () => proc.cancel());
  proc.stdin.write(LOG_LINE);
  return proc.catch(err => {
    if (!err.isCanceled) throw err;
    expect(err.stdout).toBe(dedent`
      [2019-11-03T21:07:47.064Z] DEBUG: test/85421 on localhost: hello world
          foo: bar_baz
          multiline
          cow: MOO
    `);
  });
});

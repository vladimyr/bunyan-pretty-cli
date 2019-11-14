'use strict';

/* eslint-env jest */

const { mkdirSync, readFileSync, writeFileSync } = require('fs');
const cli = require.resolve('../cli');
const crypto = require('crypto');
const dedent = require('dedent');
const execa = require('execa');
const path = require('path');

const md5 = input => crypto.createHash('md5').update(input).digest('base64');

const LOG_LINE = '{"name":"test","hostname":"localhost","pid":85421,"level":20,"foo":"bar","cow":"moo","msg":"hello world","time":"2019-11-03T21:07:47.064Z","v":0}\n';

const tempDir = path.join(process.env.TEMP_DIR, 'data_' + md5(__filename));
const source = path.join(__dirname, './fixtures/bunyan-pretty.config.js');
const dest = path.join(tempDir, 'bunyan-pretty.config.js');

mkdirSync(tempDir);
writeFileSync(dest, readFileSync(source));

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

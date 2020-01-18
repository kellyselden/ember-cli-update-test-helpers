'use strict';

const execa = require('execa');
const { promisify } = require('util');
const newTmpDir = promisify(require('tmp').dir);
const path = require('path');

function ember(args, options) {
  let ps = execa('ember', args, {
    preferLocal: true,
    localDir: __dirname,
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options
  });

  ps.stdout.pipe(process.stdout);

  return ps;
}

async function emberNew({
  projectName = 'my-project',
  args = [],
  cwd
} = {}) {
  if (cwd === undefined) {
    cwd = await newTmpDir();
  }

  await ember([
    'new',
    projectName,
    ...args
  ], {
    cwd
  });

  return path.join(cwd, projectName);
}

async function emberInit({
  args = [],
  cwd,
  overwrite = true
}) {
  if (cwd === undefined) {
    cwd = await newTmpDir();
  }

  let ps = ember([
    'init',
    ...args
  ], {
    cwd
  });

  let overwriteChar = overwrite ? 'y' : 'n';

  ps.stdout.on('data', data => {
    let str = data.toString();
    if (new RegExp(`^\\? Overwrite .+\\? \\(\\w+\\)(?! ${overwriteChar})`, 'm').test(str)) {
      ps.stdin.write(`${overwriteChar}\n`);
    }
  });

  await ps;

  return cwd;
}

module.exports.ember = ember;
module.exports.emberNew = emberNew;
module.exports.emberInit = emberInit;

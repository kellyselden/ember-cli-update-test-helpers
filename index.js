'use strict';

const execa = require('execa');
const { promisify } = require('util');
const newTmpDir = promisify(require('tmp').dir);
const path = require('path');
const fs = require('fs');
const unlink = promisify(fs.unlink);

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
} = {}) {
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

async function prepareBlueprint({
  cwd = process.cwd()
} = {}) {
  let fileName = (await execa('npm', ['pack'], {
    cwd
  })).stdout;

  let filePath = path.join(cwd, fileName);

  let tmpDir = await newTmpDir();

  await execa('npm', ['i', filePath], {
    cwd: tmpDir
  });

  let packageName = require(path.join(cwd, 'package')).name;

  let resolved = require.resolve(packageName, { paths: [tmpDir] });

  return {
    filePath,
    blueprintPath: path.dirname(resolved),
    async cleanUp() {
      await unlink(filePath);
    }
  };
}

module.exports.ember = ember;
module.exports.emberNew = emberNew;
module.exports.emberInit = emberInit;
module.exports.prepareBlueprint = prepareBlueprint;

'use strict';

const { promisify } = require('util');
const newTmpDir = promisify(require('tmp').dir);
const path = require('path');
const fs = require('fs');
const unlink = promisify(fs.unlink);

function ember(args, options) {
  let ps = this.execa('ember', args, {
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

  let execa = await import('execa');

  let { stdout } = await ember.call(execa, [
    'new',
    projectName,
    ...args
  ], {
    cwd
  });

  let dir = stdout.match(/^Successfully created project (.+)\.$/m)[1];

  return path.join(cwd, dir);
}

async function emberInit({
  args = [],
  cwd,
  overwrite = true
} = {}) {
  if (cwd === undefined) {
    cwd = await newTmpDir();
  }

  let execa = await import('execa');

  let ps = ember.call(execa, [
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
  let { execa } = await import('execa');

  let {
    stdout: fileName
  } = await execa('npm', ['pack'], {
    cwd
  });

  let npmPackPath = path.join(cwd, fileName);

  let tmpDir = await newTmpDir();

  await execa('npm', ['i', npmPackPath], {
    cwd: tmpDir
  });

  let packageName = require(path.join(cwd, 'package')).name;

  let resolved = require.resolve(packageName, { paths: [tmpDir] });

  return {
    npmPackPath,
    blueprintPath: path.dirname(resolved),
    async cleanUp() {
      try {
        await unlink(npmPackPath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
  };
}

function setUpBlueprintMocha({
  cwd = process.cwd()
} = {}) {
  // eslint-disable-next-line no-undef
  before(async function() {
    let {
      npmPackPath,
      blueprintPath,
      cleanUp
    } = await prepareBlueprint({
      cwd
    });

    this.npmPackPath = npmPackPath;
    this.blueprintPath = blueprintPath;
    this._cleanUpBlueprint = cleanUp;
  });

  // eslint-disable-next-line no-undef
  after(async function() {
    if (this._cleanUpBlueprint) {
      await this._cleanUpBlueprint();
    }
  });
}

module.exports.ember = ember;
module.exports.emberNew = emberNew;
module.exports.emberInit = emberInit;
module.exports.prepareBlueprint = prepareBlueprint;
module.exports.setUpBlueprintMocha = setUpBlueprintMocha;

'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  emberNew,
  emberInit,
  prepareBlueprint,
  setUpBlueprintMocha
} = require('..');
const { promisify } = require('util');
const newTmpDir = promisify(require('tmp').dir);
const path = require('path');
const fs = require('fs');
const copyFile = promisify(fs.copyFile);
const cpr = promisify(require('cpr'));

describe(function() {
  this.timeout(10 * 1000);

  describe(emberNew, function() {
    it('works', async function() {
      let cwd = await emberNew({
        args: [
          '-sn',
          '-sg'
        ]
      });

      expect(cwd).to.have.basename('my-project');

      expect(cwd).to.be.a.directory();
    });

    it('allows project name', async function() {
      let cwd = await emberNew({
        projectName: 'foo',
        args: [
          '-sn',
          '-sg'
        ]
      });

      expect(cwd).to.have.basename('foo');

      expect(cwd).to.be.a.directory();
    });

    it('allows cwd', async function() {
      let tmpDir = await newTmpDir();

      let cwd = await emberNew({
        args: [
          '-sn',
          '-sg'
        ],
        cwd: tmpDir
      });

      expect(cwd).to.have.dirname(tmpDir);
      expect(cwd).to.have.basename('my-project');

      expect(cwd).to.be.a.directory();
    });
  });

  describe(emberInit, function() {
    it('works', async function() {
      let cwd = await emberInit({
        args: [
          '-sn',
          '-b',
          path.resolve(__dirname, 'fixtures/blueprint')
        ]
      });

      expect(path.join(cwd, 'README.md')).to.be.a.file()
        .and.empty;
    });

    it('works inside ember app', async function() {
      let cwd = await emberNew({
        args: [
          '-sn',
          '-sg'
        ]
      });

      await copyFile(
        path.resolve(__dirname, 'fixtures/blueprint/files/README.md'),
        path.join(cwd, 'README.md')
      );

      expect(path.join(cwd, 'README.md')).to.be.a.file()
        .and.empty;

      await emberInit({
        args: [
          '-sn'
        ],
        cwd
      });

      expect(path.join(cwd, 'README.md')).to.be.a.file()
        .and.not.empty;
    });

    describe('overwrite', function() {
      it('works', async function() {
        let cwd = await emberNew({
          args: [
            '-sn',
            '-sg'
          ]
        });

        await emberInit({
          args: [
            '-sn',
            '-b',
            path.resolve(__dirname, 'fixtures/blueprint')
          ],
          cwd
        });

        expect(path.join(cwd, 'README.md')).to.be.a.file()
          .and.empty;
      });

      it('ignores', async function() {
        let cwd = await emberNew({
          args: [
            '-sn',
            '-sg'
          ]
        });

        await emberInit({
          args: [
            '-sn',
            '-b',
            path.resolve(__dirname, 'fixtures/blueprint')
          ],
          cwd,
          overwrite: false
        });

        expect(path.join(cwd, 'README.md')).to.be.a.file()
          .and.not.empty;
      });
    });
  });

  describe(prepareBlueprint, function() {
    it('works', async function() {
      let blueprintPath = path.resolve(__dirname, 'fixtures/excluded-files');

      let tmpDir = await newTmpDir();

      await cpr(blueprintPath, tmpDir);

      blueprintPath = tmpDir;

      let cwd = await emberInit({
        args: [
          '-sn',
          '-b',
          blueprintPath
        ]
      });

      expect(path.join(cwd, 'ignored'))
        .to.be.a.path('is present when it should not be');

      let {
        npmPackPath,
        blueprintPath: newBlueprintPath,
        cleanUp
      } = await prepareBlueprint({
        cwd: blueprintPath
      });

      blueprintPath = newBlueprintPath;

      cwd = await emberInit({
        args: [
          '-sn',
          '-b',
          blueprintPath
        ]
      });

      expect(path.join(cwd, 'ignored'))
        .to.not.be.a.path('is missing when it should be');

      expect(npmPackPath).to.be.a.path();

      await cleanUp();

      expect(npmPackPath).to.not.be.a.path();
    });
  });

  describe(setUpBlueprintMocha, function() {
    // eslint-disable-next-line mocha/no-setup-in-describe
    setUpBlueprintMocha.call(this, {
      // eslint-disable-next-line mocha/no-setup-in-describe
      cwd: path.resolve(__dirname, 'fixtures/excluded-files')
    });

    after(function() {
      expect(this.npmPackPath).to.not.be.a.path();
    });

    it('works', async function() {
      expect(path.join(this.blueprintPath, 'ignored'))
        .to.not.be.a.path('is missing when it should be');

      expect(this.npmPackPath).to.be.a.path();
    });
  });
});

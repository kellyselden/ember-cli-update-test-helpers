'use strict';

const { describe } = require('./helpers/mocha');
const { expect } = require('./helpers/chai');
const {
  emberNew,
  emberInit
} = require('..');
const { promisify } = require('util');
const newTmpDir = promisify(require('tmp').dir);
const path = require('path');
const fs = require('fs');
const copyFile = promisify(fs.copyFile);

describe(function() {
  this.timeout(5 * 1000);

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
        .with.contents.that.match(/overwritten/);
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
        .with.contents.that.match(/overwritten/);

      await emberInit({
        args: [
          '-sn'
        ],
        cwd
      });

      expect(path.join(cwd, 'README.md')).to.be.a.file()
        .with.contents.that.match(/README/);
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
          .with.contents.that.match(/overwritten/);
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
          .with.contents.that.match(/README/);
      });
    });
  });
});

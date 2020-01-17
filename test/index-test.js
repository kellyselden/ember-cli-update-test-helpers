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

describe(function() {
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
    describe('blueprint', function() {
      it('overwrites', async function() {
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

        expect(path.join(cwd, '.ember-cli')).to.be.a.file()
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

        expect(path.join(cwd, '.ember-cli')).to.be.a.file()
          .with.contents.that.match(/disableAnalytics/);
      });
    });
  });
});

import resolve from 'resolve';
import { join } from 'path';
import merge from 'lodash/merge';
import fs from 'fs-extra';
import { loadFromFixtureData } from './helpers';
import { baseAddon, appScenarios } from './scenarios';
import { PreparedApp } from 'scenario-tester';
import QUnit from 'qunit';
// import { expectFilesAt, ExpectFile } from '@embroider/test-support/file-assertions/qunit';

const { module: Qmodule, test } = QUnit;

appScenarios
  .only('release')
  .map('app-config-environment', _project => {
    // let addon = baseAddon();
    //
    // merge(addon.files, loadFromFixtureData('hello-world-addon'));
    // addon.pkg.name = 'my-addon';
    //
    // addon.linkDependency('@embroider/sample-transforms', { baseDir: __dirname });
    // addon.linkDependency('@embroider/macros', { baseDir: __dirname });
    // project.addDependency(addon);
    //
    // // our app will include an in-repo addon
    // project.pkg['ember-addon'] = { paths: ['lib/in-repo-addon'] };
    // merge(project.files, loadFromFixtureData('basic-in-repo-addon'));
  })
  .forEachScenario(async scenario => {
    Qmodule(`${scenario.name}`, function (hooks) {
      let app: PreparedApp;
      let workspaceDir: string;

      hooks.before(async assert => {
        // TODO(@22a): set tests: true,
        // TODO(@22a): set storeConfigInMeta: false,
        // TODO(@22a): set some unique config key in the app's test config
        process.env.THROW_UNLESS_PARALLELIZABLE = '1'; // see https://github.com/embroider-build/embroider/pull/924
        app = await scenario.prepare();
        let result = await app.execute('cross-env node ./node_modules/ember-cli/bin/ember b');
        assert.equal(result.exitCode, 0, result.output);
        workspaceDir = fs.readFileSync(join(app.dir, 'dist', '.stage1-output'), 'utf8');
      });

      hooks.after(async () => {
        delete process.env.THROW_UNLESS_PARALLELIZABLE;
      });

      test('config/environment.js module exists with correct content', function (assert) {
        assert.ok(fs.existsSync(join(workspaceDir, 'node_modules/my-addon/_app_/components/hello-world.js')));
        assert.ok(true);
        // TODO(@22a): assert that the unique config key exists somewhere in the ... correct modules?
      });
    });
  });

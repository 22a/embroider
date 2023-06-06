import merge from 'lodash/merge';
import { appScenarios } from './scenarios';
import { PreparedApp } from 'scenario-tester';
import QUnit from 'qunit';

const { module: Qmodule, test } = QUnit;

appScenarios
  .only('release')
  .map('app-config-environment', project => {
    merge(project.files, {
      'ember-cli-build.js': `
        'use strict';

        const EmberApp = require('ember-cli/lib/broccoli/ember-app');
        const { maybeEmbroider } = require('@embroider/test-setup');

        module.exports = function (defaults) {
          let app = new EmberApp(defaults, {
            tests: true,
            storeConfigInMeta: false,
          });
          return maybeEmbroider(app, {});
        };
      `,
      config: {
        'environment.js': `module.exports = function(environment) {
          let ENV = {
            // DEFAULTS
            modulePrefix: 'my-app',
            podModulePrefix: '',
            environment,
            rootURL: '/',
            locationType: 'auto',
            EmberENV: {
              FEATURES: {
              },
              EXTEND_PROTOTYPES: {
                Date: false
              }
            },
            APP: {},

            // CUSTOM
            someCustomField: true,
          };
          return ENV;
        };`,
      },
      tests: {
        unit: {
          'store-config-in-meta-test.js': `
            import { module, test } from 'qunit';
            import ENV from 'app-template/config/environment';
            console.log(ENV.someCustomField)

            module('Unit | storeConfigInMeta', function (hooks) {
              test('it has loaded the correct config values', async function (assert) {
                assert.equal(ENV.someCustomField, true);
              });
            });`,
        },
      },
    });
  })
  .forEachScenario(scenario => {
    Qmodule(scenario.name, function (hooks) {
      let app: PreparedApp;
      hooks.before(async () => {
        app = await scenario.prepare();
      });

      test(`yarn test`, async function (assert) {
        let result = await app.execute(`yarn test`);
        assert.equal(result.exitCode, 0, result.output);
      });
    });
  });

# puppeteer-velo-test-kit

![logo](./puppeteer-velo-test-kit.png)

## Description

This library was created for efficient E2E testing of sites using Velo. It enables the launching of preview sites using specific revisions or local source code, allowing for testing against those sites.

## Requirements

- Node.js V18
- Install [Wix CLI](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli/working-with-the-wix-cli) and login
- Wix site with [Git integration](https://dev.wix.com/docs/develop-websites/articles/workspace-tools/developer-tools/git-integration-wix-cli/integrating-your-site-with-git-hub)

## How to setup

The puppeteer-velo-test-kit includes puppeteer as a peer dependency. Install it using the following command:

```bash
npm install --save-dev puppeteer git+https://github.com/wix-incubator/puppeteer-velo-test-kit.git
```

Also, for testing purposes, please install jest. The choice of test runner, such as vitest, does not matter.

```bash
npm install --save-dev jest
```

After completing the installation, please add the following to the `scripts` section in your `package.json`:

```json
"refresh-test-configs": "refreshTestsConfigs",
"test": "jest",
"test-debug": "DEBUG=true jest"
```

To generate test configuration files (`wix-preview-tester.config.json`) with your current local source code, run:

```
npm run refresh-test-configs
```

Execute tests by running:

```
npm run test
```

This uses the saved `wix-preview-tester.config.json` for testing.

For debugging tests, run:

```
npm run test-debug
```

This launches a browser for each execution and regenerates the test configuration file using the current local source code.

Ultimately, your `package.json` should look like this:

```json
{
  "scripts": {
    "postinstall": "wix sync-types",
    "dev": "wix dev",
    "lint": "eslint .",
    "refresh-test-configs": "refreshTestsConfigs",
    "test": "jest",
    "test-debug": "DEBUG=true jest"
  },
  "devDependencies": {
   "@wix/cli": "^1.0.0",
    "@wix/eslint-plugin-cli": "^1.0.0",
    "eslint": "^8.25.0",
    "jest": "^29.7.0",
    "puppeteer": "^21.6.1",
    "puppeteer-velo-test-kit": "github:wix-incubator/puppeteer-velo-test-kit",
    "react": "16.14.0"
  }
}
```

## How to run

If you have a test file like the one below:

```javascript
const { E2EDriver } = require('puppeteer-velo-test-kit');

describe('E2EDriver Test', () => {
    const driver = new E2EDriver();

    beforeEach(async () => {
        await driver.init({ baseUrl: 'https://kyoheif.editorx.io/my-site-31' });
    }, 10000);

    afterEach(async () => {
        await driver.clean();
    });

    test('should have the correct page content', async () => {
        await driver.when.openDesktopPage('/');
        const content = await driver.get.textContent('h1');
        expect(content).toBe('Hello World');
    });
});
```

The test can be executed by running:

```
npm run test
```


*Please refer to the following repository as an example.  
https://github.com/hand-dot/my-site-31



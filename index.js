const puppeteer = require('puppeteer');
const { getTestsConfig, refreshTestsConfigs } = require('wix-preview-tester');

const NAVIGATION_TIMEOUT = 30000;

/**
 * @typedef {import('puppeteer').Browser} Browser
 * @typedef {import('puppeteer').Page} Page
 */
class E2EDriver {
    /** @type {Browser} */
    browser;
    /** @type {Page}*/
    page;
    /** @type {{branchId: string; siteRevision: string}} */
    branchConfig;
    /** @type {string} */
    baseUrl;

    async init({ baseUrl = '' }) {
        this.baseUrl = baseUrl;
        await Promise.all([this.initBranchConfig(), this.initPuppeteer()])
    }

    isDebug() {
        return process.env.DEBUG === 'true';
    }

    async initPuppeteer() {
        if (this.browser) {
            return;
        }
        const now = new Date();
        console.log('⌛ Initializing puppeteer...');
        this.browser = await puppeteer.launch({ headless: this.isDebug() ? false : 'new' });
        this.page = await this.browser.newPage();
        const end = new Date() - now;
        console.log(`✅ Puppeteer initialized in ${end}ms`);
    }

    async initBranchConfig() {
        if (this.branchConfig) {
            return;
        }

        const now = new Date();
        const testsConfig = getTestsConfig();
        const notExists = !testsConfig.branchId || !testsConfig.siteRevision;
        if (notExists || this.isDebug()) {
            try {
                console.log('⌛ Refreshing tests configs...');
                const newTestsConfig = await refreshTestsConfigs();
                testsConfig.branchId = newTestsConfig.branchId;
                testsConfig.siteRevision = newTestsConfig.siteRevision;
                console.log('✅ Tests configs refreshed!');
            } catch (e) {
                console.error('❌ Failed to refresh tests configs', e);
                throw e;
            }
        } else {
            console.log(`✅ Using cached tests configs`);
        }
        this.branchConfig = testsConfig;
        console.log(`🌐 Branch ID: ${this.branchConfig.branchId}`);
        console.log(`🌐 Site Revision: ${this.branchConfig.siteRevision}`);
        const end = new Date() - now;
        console.log(`✅ Branch config initialized in ${end}ms`);
    }

    async clean() {
        if (this.isDebug()) {
            console.log('not closing browser on debug mode');
        } else {
            await this.browser && this.browser.close();
            this.browser = null;
        }
    }

    #p = {
        /**
         * @param {string} path
         * @param {Object} [options] - The options object.
        */
        getUrlToOpen: (path, options = {}) => {
            const url = new URL(this.baseUrl);
            const parsedURL = new URL((path === '' || path === '/') ? '' : path, this.baseUrl);
            url.pathname = parsedURL.pathname;
            url.search = parsedURL.search;
            url.searchParams.set('branchId', this.branchConfig.branchId);
            url.searchParams.set('siteRevision', this.branchConfig.siteRevision);
            return url.href;
        },
    };


    // trigger some action
    when = {
        /**
         * @param {string} [path]
         * @param {Object} [options] - The options object.
        */
        openDesktopPage: async (path = '', options = {}) => {
            await this.page.goto(this.#p.getUrlToOpen(path, options), {
                timeout: NAVIGATION_TIMEOUT,
                waitUntil: 'domcontentloaded',
            });
        },
        /**
         * @param {string} [path]
         * @param {Object} [options] - The options object.
        */
        openMobilePage: async (path = '', options = {}) => {
            const iphoneSeUserAgent =
                'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1';
            await this.page.emulate({
                viewport: {
                    width: 375,
                    height: 667,
                    isMobile: true,
                },
                userAgent: iphoneSeUserAgent,
            });
            return this.when.openDesktopPage(path, options);
        },
        /**
         *  @param {string} selector
         *  @param {puppeteer.WaitForSelectorOptions} options
         */
        waitFor: async (selector, options = { visible: true }) => {
            return this.page.waitForSelector(selector, options);
        },
    };
    // should return boolean
    is = {
        /**
         * @param {string} selector
         * @returns {Promise<boolean>}
         */
        visible: async (selector) => {
            try {
                await this.page.waitForSelector(selector);
                return this.page.$eval(selector, (element) => getComputedStyle(element).visibility === 'visible');
            } catch {
                return false;
            }
        },
        /**
         * @param {string} selector
         * @returns {Promise<boolean>}
         */
        focused: async (selector) => {
            return this.page.$eval(selector, (element) => element === document.activeElement);
        },
    };

    get = {
        title: () => {
            return this.page.title();
        },
        /** @param {string} selector */
        textContent: async (selector) => {
            return this.page.$eval(selector, (el) => el.textContent);
        },
        /** @param {string} selector */
        textContentAll: (selector) => {
            return this.page.$$eval(selector, (els) =>
                els.map((el) => el.textContent ?? ''),
            );
        },
        /** @param {string} selector */
        outerHTML(selector) {
            return this.page.$eval(selector, (el) => el.outerHTML);
        },
        /** @param {string} selector */
        outerHtmlAll: (selector) => {
            return this.page.$$eval(selector, (els) =>
                els.map((el) => el.outerHTML ?? ''),
            );
        },
        /**
         * @param {string} selector
         * @param {string} qualifiedName
         */
        attributeFor: (selector, qualifiedName) => {
            return this.page.evaluate(
                (s, attr) => {
                    return document.querySelector(s)?.getAttribute(attr);
                },
                selector,
                qualifiedName,
            );
        },
        /**
         * @param {string} selector
         * @param {string} qualifiedName
         */
        attributeForAll: (selector, qualifiedName) => {
            return this.page.evaluate(
                (s, attr) => {
                    return Array.from(document.querySelectorAll(s)).map((el) =>
                        el.getAttribute(attr),
                    );
                },
                selector,
                qualifiedName,
            );
        },
    };
}

module.exports = {
    E2EDriver,
};

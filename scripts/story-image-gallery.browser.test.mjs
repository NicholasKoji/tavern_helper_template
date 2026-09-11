// Run with PLAYWRIGHT_MODULE pointing to an installed Playwright package when it is not in this repo.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { parse, compileScript } from 'vue/compiler-sfc';
import * as sass from 'sass';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const transpile = source =>
  ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
const moduleSource = file => transpile(fs.readFileSync(`src/剧情生图/${file}`, 'utf8'));
const { descriptor } = parse(fs.readFileSync('src/剧情生图/ImageGallery.vue', 'utf8'));
const component = transpile(compileScript(descriptor, { id: 'gallery-test', inlineTemplate: true }).content);
const css = sass.compile('src/剧情生图/style.scss').css;
const browser = await chromium.launch({ headless: true });
const errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1200, height: 850 }, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const fixtureSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1600"><rect width="1200" height="1600" fill="#527792"/><circle cx="600" cy="700" r="320" fill="#c5dce5"/><text x="100" y="1450" font-size="70">IMAGE PREVIEW TEST</text></svg>';
  await page.route('**/user/images/story_image/**', route =>
    route.fulfill({ contentType: 'image/svg+xml', body: fixtureSvg }),
  );
  await page.setContent(`<base href="http://fixture.test/"><style>${css}</style>
    <style>body{margin:0;background:#232a34;color:#dce4ed;font-family:system-ui}#settings{width:min(1000px,94%);max-height:90%;box-sizing:border-box;background:#293441;color:#dce4ed;padding:18px}</style>
    <div class="story-image-slot"><img tabindex="0" role="button" class="story-image-img" src="user/images/story_image/message.png" alt="楼层图" width="120"></div>
    <div class="story-image-root"><dialog id="settings"><div id="gallery"></div>
    <div class="reference-library"><img tabindex="0" role="button" src="user/images/story_image/reference.png" alt="参考候选" width="100"></div></dialog></div>`);
  await page.addScriptTag({ path: require.resolve('vue/dist/vue.global.js') });
  await page.addScriptTag({
    content: `{ const exports = {}; ${moduleSource('image-preview.ts')}; window.preview = exports; window.disposePreview = exports.bindImagePreviews(document); }`,
  });
  // Existing message image: delegated open, wheel zoom, pan without closing, reset, click close.
  await page.locator('.story-image-slot img').click();
  await page.locator('.story-image-preview img').evaluate(img => img.decode());
  await page.mouse.move(600, 425);
  await page.mouse.wheel(0, -600);
  await page.waitForFunction(() => parseInt(document.querySelector('[data-scale]').textContent) > 100);
  await page.mouse.down();
  await page.mouse.move(650, 470, { steps: 6 });
  await page.mouse.up();
  assert.equal(await page.locator('.story-image-preview[open]').count(), 1);
  await page.locator('[data-reset]').click();
  assert.equal(await page.locator('[data-scale]').textContent(), '100%');
  await page.mouse.click(600, 425);
  assert.equal(await page.locator('.story-image-preview').count(), 0);
  // Keyboard entry and Esc restore focus without reaching Tavern's global Esc handler.
  await page.locator('.story-image-slot img').focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('.story-image-slot img').evaluate(el => document.activeElement === el), true);

  await page.addScriptTag({
    content: `{ const exports = {}; ${moduleSource('gallery.ts')}; window.galleryModule = exports; }`,
  });
  await page.evaluate(() => {
    window.files = Array.from(
      { length: 75 },
      (_, i) => `story-image-${i % 3 === 0 ? 'reference-library' : 'chat-a'}-0-0-${1790000000000 - i * 1000}.png`,
    );
    window.apiFailure = false;
    window.SillyTavern = { getRequestHeaders: () => ({ 'X-CSRF-Token': 'fixture' }) };
    window.fetch = async (_url, init) => {
      window.lastRequest = JSON.parse(init.body);
      return { ok: !window.apiFailure, status: 500, json: async () => window.files };
    };
    window.getChatMessages = () => [
      {
        message_id: 3,
        extra: {
          story_image_v1: {
            version: 1,
            swipes: {
              0: { history: [{ path: window.files[1] }] },
            },
          },
        },
      },
    ];
    window.tavern_events = { CHAT_CHANGED: 'chat_changed' };
    window.eventOn = (_event, fn) => {
      window.chatChanged = fn;
      return {
        stop() {
          window.chatChanged = null;
        },
      };
    };
    document.getElementById('settings').showModal();
    window.outerEsc = 0;
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') window.outerEsc++;
    });
  });
  await page.addScriptTag({
    content: `{ const exports = {}; const require = name => ({ vue: Vue, './gallery': galleryModule, './image-preview': preview, './tavern-dom': { tavernDocument: document } })[name]; ${component}; window.galleryApp = Vue.createApp(exports.default); galleryApp.mount('#gallery'); }`,
  });
  await page.waitForFunction(() => document.querySelectorAll('.story-image-gallery-item').length === 60);
  const thumbSize = await page.locator('.story-image-gallery-thumb').first().boundingBox();
  assert.ok(Math.abs(thumbSize.width - thumbSize.height) < 1, 'thumbnails stay square for portrait originals');
  assert.deepEqual(await page.evaluate(() => window.lastRequest), {
    folder: 'story_image',
    sortField: 'date',
    sortOrder: 'desc',
  });
  assert.equal(
    await page.locator('.story-image-gallery-item').first().getAttribute('title'),
    'story-image-reference-library-0-0-1790000000000.png',
  );
  await page.getByRole('button', { name: '加载更多', exact: true }).click();
  assert.equal(await page.locator('.story-image-gallery-item').count(), 75);
  await page.locator('.story-image-gallery-filters select').first().selectOption('reference');
  assert.equal(await page.locator('.story-image-gallery-item').count(), 25);
  await page.locator('.story-image-gallery-filters select').first().selectOption('all');
  await page.locator('.story-image-gallery-filters select').nth(1).selectOption('chat');
  assert.equal(await page.locator('.story-image-gallery-item').count(), 1);
  await page.locator('.story-image-gallery-item').click();
  assert.equal(await page.locator('#settings').evaluate(el => el.open), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => window.outerEsc), 0);
  assert.equal(await page.locator('#settings').evaluate(el => el.open), true);
  await page.locator('.reference-library img').click();
  assert.equal(await page.locator('.story-image-preview img').getAttribute('alt'), '参考候选');
  await page.keyboard.press('Escape');
  await page.locator('.story-image-gallery-filters select').nth(1).selectOption('all');
  if (process.env.STORY_IMAGE_TEST_OUTPUT) {
    fs.mkdirSync(process.env.STORY_IMAGE_TEST_OUTPUT, { recursive: true });
    await page.screenshot({ path: path.join(process.env.STORY_IMAGE_TEST_OUTPUT, 'gallery-desktop.png') });
  }
  // Narrow screen: two columns and native multi-touch pinch/pan via Chromium's input pipeline.
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page
      .locator('.story-image-gallery-grid')
      .evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length),
    2,
  );
  assert.equal(await page.locator('#settings').evaluate(el => el.scrollWidth <= el.clientWidth), true);
  if (process.env.STORY_IMAGE_TEST_OUTPUT)
    await page.screenshot({ path: path.join(process.env.STORY_IMAGE_TEST_OUTPUT, 'gallery-mobile.png') });
  await page.locator('.story-image-gallery-item').first().click();
  await page.locator('.story-image-preview img').evaluate(img => img.decode());
  const cdp = await context.newCDPSession(page);
  const touch = (type, points) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([id, x, y]) => ({ id, x, y })) });
  await touch('touchStart', [
    [0, 150, 400],
    [1, 240, 400],
  ]);
  await touch('touchMove', [
    [0, 70, 400],
    [1, 320, 400],
  ]);
  await touch('touchEnd', []);
  await page.waitForFunction(() => parseInt(document.querySelector('[data-scale]').textContent) > 150);
  assert.equal(await page.locator('.story-image-preview[open]').count(), 1);
  await touch('touchStart', [[0, 190, 420]]);
  await touch('touchMove', [[0, 240, 460]]);
  await touch('touchEnd', []);
  assert.equal(await page.locator('.story-image-preview[open]').count(), 1);
  if (process.env.STORY_IMAGE_TEST_OUTPUT)
    await page.screenshot({ path: path.join(process.env.STORY_IMAGE_TEST_OUTPUT, 'preview-mobile.png') });
  await page.locator('[data-reset]').tap();
  assert.equal(await page.locator('.story-image-preview[open]').count(), 1);
  assert.equal(await page.locator('[data-scale]').textContent(), '100%');
  await page.touchscreen.tap(190, 420);
  await page.waitForFunction(() => !document.querySelector('.story-image-preview'));
  // API errors recover; an unavailable chat never hides the all-images server directory.
  await page.evaluate(() => {
    window.apiFailure = true;
  });
  await page.getByRole('button', { name: '刷新图库', exact: true }).click();
  await page.getByRole('alert').waitFor();
  await page.evaluate(() => {
    window.apiFailure = false;
    window.getChatMessages = () => {
      throw Error('no active chat');
    };
  });
  await page.getByRole('button', { name: '刷新图库', exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll('.story-image-gallery-item').length === 60);
  await page.evaluate(() => {
    window.galleryApp.unmount();
    window.disposePreview();
  });
  assert.equal(await page.evaluate(() => window.chatChanged), null);
  assert.deepEqual(errors, []);
  console.log(
    'GALLERY_BROWSER_TESTS_OK: desktop click/wheel/pan, keyboard, modal layering, all kinds, filters, pagination, mobile two-column, native pinch/pan/tap, API recovery, no-chat, cleanup',
  );
} finally {
  await browser.close();
}

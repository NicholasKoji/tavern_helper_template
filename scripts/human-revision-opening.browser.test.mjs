import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { parse, compileScript, compileStyle } from 'vue/compiler-sfc';
import * as sass from 'sass';

// Local regression harness. Real Vue components; Tavern APIs and AI are mocked.
// Run: PLAYWRIGHT_MODULE=<installed playwright> node scripts/human-revision-opening.browser.test.mjs
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve('src/人间修订中/界面/世界配置');
const modules = {};
let counter = 0;
const styles = [];
function collect(filename) {
  if (modules[filename]) return filename;
  const record = (modules[filename] = { source: '', dependencies: {} });
  let source = fs.readFileSync(filename, 'utf8');
  if (filename.endsWith('.vue')) {
    const id = `data-v-opening-test-${counter++}`;
    const { descriptor } = parse(source, { filename });
    source = compileScript(descriptor, { id, inlineTemplate: true }).content;
    for (const style of descriptor.styles) {
      const css = style.lang === 'scss' ? sass.compileString(style.content).css : style.content;
      const result = compileStyle({ source: css, filename, id, scoped: style.scoped });
      assert.deepEqual(result.errors, []);
      styles.push(result.code);
    }
    record.scopeId = id;
  }
  record.source = /\.(vue|ts)$/.test(filename)
    ? ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      }).outputText
    : source;
  for (const match of record.source.matchAll(/require\(["']([^"']+)["']\)/g)) {
    const specifier = match[1];
    if (['vue', 'pinia', '@lucide/vue'].includes(specifier)) {
      record.dependencies[specifier] = specifier;
      continue;
    }
    if (specifier.endsWith('?url')) {
      record.dependencies[specifier] = 'asset';
      continue;
    }
    if (filename === path.join(root, 'App.vue') && specifier === './store') {
      record.dependencies[specifier] = 'mock-store';
      continue;
    }
    const resolver = createRequire(filename);
    let resolved;
    try {
      resolved = resolver.resolve(specifier);
    } catch {
      resolved = resolver.resolve(specifier + '.ts');
    }
    record.dependencies[specifier] = collect(resolved);
  }
  return filename;
}
const entry = collect(path.join(root, 'App.vue'));
styles.unshift(
  fs.readFileSync(path.join(root, 'theme-tokens.css'), 'utf8'),
  fs.readFileSync(path.join(root, 'global.css'), 'utf8').replace(/@import[^;]+;/g, ''),
);
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('http://opening.test/**', route =>
  route.fulfill({ contentType: 'text/html', body: '<div id="app"></div>' }),
);
await page.goto('http://opening.test/');
await page.addScriptTag({ path: require.resolve('vue/dist/vue.global.js') });
await page.addStyleTag({ content: styles.join('\n') });
try {
  await page.evaluate(
    ({ modules, entry }) => {
      const state = Vue.ref({
        当前场景: {
          地点: { 一级区域: '', 二级区域: '', 三级地点: '' },
          日期: { 年: null, 月: null, 日: null },
          时间: { 时: null, 分: null },
          摘要: '',
        },
        主角: {
          启用: true,
          基础信息: { 姓名: '测试玩家', 性别: '', 年龄: -1, 身份: '', 目标: '' },
          外貌: {},
          性格: {},
          补充设定: '',
          穿着: {},
          私密状态: {},
        },
        NPC序列: {},
        现实编辑器: {},
        生效规则: {},
      });
      const cache = {};
      const icon = { render: () => Vue.h('svg', { width: 16, height: 16, 'aria-hidden': true }) };
      const mocks = {
        vue: Vue,
        pinia: { storeToRefs: value => value },
        '@lucide/vue': new Proxy({}, { get: (_, key) => (key === '__esModule' ? true : icon) }),
        asset: '',
        'mock-store': { useDataStore: () => ({ data: state }) },
      };
      function load(id) {
        if (id in mocks) return mocks[id];
        if (cache[id]) return cache[id].exports;
        const module = (cache[id] = { exports: {} });
        const record = modules[id];
        new Function('require', 'module', 'exports', record.source)(
          specifier => load(record.dependencies[specifier]),
          module,
          module.exports,
        );
        if (record.scopeId) module.exports.default.__scopeId = record.scopeId;
        return module.exports;
      }
      window.SillyTavern = { name1: '测试玩家', eventTypes: {} };
      window.eventOn = () => ({ stop() {} });
      window.getCurrentMessageId = () => 0;
      window.__requests = [];
      window.generateRaw = async options => {
        window.__requests.push(options);
        if (window.__delay)
          await new Promise(resolve => {
            window.__resolveAi = resolve;
          });
        if (options.generation_id.startsWith('human-revision-opening-')) return '测试开场正文<StatusPlaceHolderImpl/>';
        if (options.generation_id.startsWith('human-revision-location-'))
          return JSON.stringify({
            结论: '地点建议',
            理由: '',
            可执行约束: [],
            可采用: window.__badLocation
              ? { 'opening.location.1': '临海市' }
              : {
                  'opening.location.1': '试图替换原地点',
                  'opening.location.2': '老港区',
                  'opening.location.3': '灯塔街咖啡馆',
                },
          });
        const prompt = options.ordered_prompts.map(item => item.content || '').join('\n');
        const target = prompt.match(/目标字段 ID：([^\n]+)/)?.[1];
        return JSON.stringify({
          结论: '测试建议',
          理由: '',
          可执行约束: [],
          可采用: { [target]: '仅当前字段的建议', 'society.economy': '越界内容应丢弃' },
        });
      };
      const app = Vue.createApp(load(entry).default);
      app.mount('#app');
    },
    { modules, entry },
  );
  await page.getByRole('heading', { name: '这个世界原本是什么样？' }).waitFor();
  assert.equal(await page.locator('.step-item').count(), 6);
  assert.equal(await page.locator('.dossier-summary-column').count(), 0);
  assert.equal(await page.locator('.question-card').count(), 5);
  // Preview has no write effect; cancel leaves input empty; adoption is editable and local.
  const overview = page.locator('.question-card').first();
  await overview.getByRole('button', { name: 'AI 建议' }).click();
  await page.getByRole('dialog', { name: /AI 结果预览/ }).waitFor();
  assert.equal(await overview.locator('textarea').inputValue(), '');
  assert.equal(await page.locator('.values-grid textarea').count(), 1);
  await page.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await overview.locator('textarea').inputValue(), '');
  await overview.getByRole('button', { name: 'AI 建议' }).click();
  await page.locator('.values-grid textarea').fill('玩家修改后的世界概况');
  await page.getByRole('button', { name: '采用此建议' }).click();
  assert.equal(await overview.locator('textarea').inputValue(), '玩家修改后的世界概况');
  // Changed context while a request is running makes the result stale.
  await page.evaluate(() => {
    window.__delay = true;
  });
  await page.locator('.question-card').nth(1).getByRole('button', { name: 'AI 建议' }).click();
  await page.waitForFunction(() => Boolean(window.__resolveAi));
  await overview.locator('textarea').fill('修改上下文');
  await page.evaluate(() => {
    window.__delay = false;
    window.__resolveAi();
  });
  await page.locator('.modal-stale-alert').waitFor();
  assert.equal(await page.getByRole('button', { name: '采用此建议' }).isDisabled(), true);
  await page.getByRole('button', { name: '取消', exact: true }).click();
  // Explicit "无" is a valid world answer, not an empty field to overwrite in bulk.
  await page.locator('.question-card').nth(1).locator('textarea').fill('无');
  await page.getByRole('button', { name: '帮我补全这一页' }).click();
  await page.getByRole('dialog', { name: /AI 补全预览/ }).waitFor();
  const bulkPrompt = await page.evaluate(() =>
    window.__requests
      .at(-1)
      .ordered_prompts.map(item => item.content || '')
      .join('\n'),
  );
  const pendingSection = bulkPrompt.split('【当前层允许返回的字段】')[1].split('【已确认上下文】')[0];
  assert.ok(!pendingSection.includes('foundation.laws'));
  await page.getByRole('button', { name: '取消', exact: true }).click();
  // World layers are optional; navigation does not request AI or force completion.
  for (const count of [4, 3]) {
    await page.getByRole('button', { name: '下一步' }).click();
    await page.waitForTimeout(550);
    assert.equal(await page.locator('.question-card').count(), count);
  }
  await page.getByRole('button', { name: '下一步' }).click();
  await page.getByRole('heading', { name: '主角与重要登场人物' }).waitFor();
  await page.getByRole('button', { name: '下一步' }).click();
  await page.getByRole('heading', { name: '你想怎样改变现实？' }).waitFor();
  assert.equal(await page.getByRole('button', { name: '生成开场' }).count(), 0);
  await page.getByRole('button', { name: '下一步' }).click();
  await page.getByRole('heading', { name: '选择进入世界的瞬间' }).waitFor();
  // One composite suggestion: preserve known locations, preview/edit/cancel, atomic adoption.
  assert.equal(await page.locator('.location-ai-btn').count(), 1);
  assert.equal(await page.locator('.location-grid button').count(), 0);
  await page.locator('.location-grid input').first().fill('玩家指定城市');
  await page.locator('.location-ai-btn').click();
  await page.locator('.values-grid textarea').first().waitFor();
  assert.equal(await page.locator('.values-grid textarea').count(), 3);
  assert.equal(await page.locator('.values-grid textarea').first().inputValue(), '玩家指定城市');
  assert.equal(await page.locator('.location-grid input').nth(1).inputValue(), '');
  await page.getByRole('button', { name: '取消', exact: true }).click();
  assert.equal(await page.locator('.location-grid input').nth(2).inputValue(), '');
  await page.locator('.location-ai-btn').click();
  await page.locator('.values-grid textarea').nth(2).fill('玩家修改的咖啡馆');
  await page.getByRole('button', { name: '采用此建议' }).click();
  assert.deepEqual(await page.locator('.location-grid input').evaluateAll(inputs => inputs.map(i => i.value)), [
    '玩家指定城市',
    '老港区',
    '玩家修改的咖啡馆',
  ]);
  for (const input of await page.locator('.location-grid input').all()) await input.fill('');
  await page.evaluate(() => {
    window.__badLocation = true;
  });
  await page.locator('.location-ai-btn').click();
  await page.getByText('地点建议还不完整，请再试一次。', { exact: true }).waitFor();
  assert.equal(await page.locator('.ai-modal-overlay').count(), 0);
  assert.deepEqual(await page.locator('.location-grid input').evaluateAll(inputs => inputs.map(i => i.value)), [
    '',
    '',
    '',
  ]);
  await page.evaluate(() => {
    window.__badLocation = false;
  });
  await page.evaluate(() => {
    window.__delay = true;
    window.__resolveAi = null;
  });
  await page.locator('.location-ai-btn').click();
  await page.waitForFunction(() => Boolean(window.__resolveAi));
  await page.locator('.location-grid input').first().fill('后来填写的城市');
  await page.evaluate(() => {
    window.__delay = false;
    window.__resolveAi();
  });
  await page.locator('.modal-stale-alert').waitFor();
  assert.equal(await page.getByRole('button', { name: '采用此建议' }).isDisabled(), true);
  await page.getByRole('button', { name: '重新生成', exact: true }).click();
  await page.locator('.values-grid textarea').first().waitFor();
  assert.equal(await page.locator('.values-grid textarea').first().inputValue(), '后来填写的城市');
  await page.locator('.values-grid textarea').nth(2).fill('');
  await page.getByRole('button', { name: '采用此建议' }).click();
  assert.equal(await page.locator('.ai-modal-overlay').count(), 1);
  assert.equal(await page.locator('.location-grid input').nth(1).inputValue(), '');
  await page.getByRole('button', { name: '取消', exact: true }).click();

  const before = await page.evaluate(() => window.__requests.length);
  await page.getByRole('button', { name: '生成开场' }).click();
  assert.equal(await page.evaluate(() => window.__requests.length), before);
  await page.getByRole('textbox', { name: '开场日期年', exact: true }).fill('1995');
  await page.getByRole('textbox', { name: '开场日期月', exact: true }).fill('6');
  await page.getByRole('textbox', { name: '开场日期日', exact: true }).fill('8');
  const locations = ['城市 / A', '北区·沿河', '楼内 > 房间'];
  for (let i = 0; i < 3; i++) await page.locator('.location-grid input').nth(i).fill(locations[i]);
  await page.getByRole('button', { name: '生成开场' }).click();
  await page.locator('.preview-text').waitFor();
  const request = await page.evaluate(() => window.__requests.at(-1));
  const prompt = request.ordered_prompts.map(item => item.content || '').join('\n');
  for (const value of locations) assert.ok(prompt.includes(value));
  assert.ok(!prompt.includes('"社会生活"'));
  assert.ok(!prompt.includes('"叙事偏好"'));
  assert.ok(!prompt.includes('"localId"'));
  // Saving/restoring never needs a real Tavern write.
  page.once('dialog', dialog => dialog.accept('六层浏览器测试'));
  await page.getByRole('button', { name: '保存为新方案' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('人间修订中:开场配置方案库:v3')));
  assert.equal(saved.plans[0].schemaVersion, 3);
  assert.deepEqual(Object.values(saved.plans[0].表单快照.开局.起始地点), locations);
  await page.locator('.location-grid input').nth(2).fill('临时改动');
  await page.locator('.step-item').first().click();
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '套用并准备开场' }).click();
  await page.getByRole('heading', { name: '选择进入世界的瞬间' }).waitFor();
  assert.equal(await page.locator('.location-grid input').nth(2).inputValue(), locations[2]);
  // Every step fits narrow iframes; screenshots are optional test outputs.
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    for (let step = 0; step < 6; step++) {
      await page.locator('.step-item').nth(step).click();
      await page.waitForTimeout(550);
      const navigation = await page.locator('.step-wizard-nav').evaluate(nav => ({
        tops: [...nav.querySelectorAll('.step-item')].map(el => el.getBoundingClientRect().top),
        width: nav.clientWidth,
        scrollWidth: nav.scrollWidth,
      }));
      assert.equal(new Set(navigation.tops).size, 1, 'navigation must stay in one row');
      if (width <= 390) assert.ok(navigation.scrollWidth > navigation.width);
      if (step === 4) {
        const cards = await page
          .locator('.grid-3-col > .choice-card')
          .evaluateAll(items =>
            items.map(el => ({ top: el.getBoundingClientRect().top, bottom: el.getBoundingClientRect().bottom })),
          );
        assert.equal(cards.length, 3);
        assert.ok(cards[1].top >= cards[0].bottom && cards[2].top >= cards[1].bottom);
      }
      if (step === 5) {
        assert.equal(await page.locator('legend').count(), 0);
        const titlesFit = await page.locator('.coordinate-title').evaluateAll(titles =>
          titles.every(el => {
            const title = el.getBoundingClientRect(),
              card = el.closest('.coordinate-fields').getBoundingClientRect();
            return title.top >= card.top && title.bottom <= card.bottom && title.height >= 22;
          }),
        );
        assert.ok(titlesFit, 'section titles must be fully inside normal flow');
      }
      const size = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: window.innerWidth,
      }));
      assert.ok(size.content <= size.viewport, `step ${step + 1} overflows at ${width}: ${JSON.stringify(size)}`);
    }
  }
  // Next/previous navigation scrolls the active item into view without clicking the tab itself.
  await page.locator('.step-item').first().click();
  for (let i = 0; i < 5; i++) {
    await page.getByRole('button', { name: '下一步', exact: true }).click();
    await page.waitForTimeout(550);
    assert.ok(
      await page.locator('.step-wizard-nav').evaluate(nav => {
        const outer = nav.getBoundingClientRect(),
          active = nav.querySelector('.is-active').getBoundingClientRect();
        return active.left >= outer.left && active.right <= outer.right;
      }),
    );
  }
  await page.getByRole('button', { name: '上一步', exact: true }).click();
  await page.waitForTimeout(550);
  await page.getByRole('button', { name: '下一步', exact: true }).click();
  await page.waitForTimeout(550);
  await page.getByRole('button', { name: '设置与主题偏好' }).click();
  const themes = await page.getByRole('radio').count();
  for (let i = 0; i < themes; i++) {
    if (i) await page.getByRole('button', { name: '设置与主题偏好' }).click();
    await page.getByRole('radio').nth(i).click();
    await page.waitForTimeout(550);
    assert.ok(
      await page.locator('.coordinate-title').evaluateAll(titles =>
        titles.every(el => {
          const a = el.getBoundingClientRect(),
            b = el.closest('.coordinate-fields').getBoundingClientRect();
          return a.top >= b.top && a.bottom <= b.bottom;
        }),
      ),
    );
  }
  assert.deepEqual(errors, []);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(550);
  if (process.env.OPENING_SCREENSHOT) await page.screenshot({ path: process.env.OPENING_SCREENSHOT, fullPage: true });
  console.log(
    'six-layer Vue browser tests: PASS (navigation, optional fields, AI preview/edit/cancel/stale, structured locations, save/restore, 1280/390/320px)',
  );
} finally {
  await browser.close();
}

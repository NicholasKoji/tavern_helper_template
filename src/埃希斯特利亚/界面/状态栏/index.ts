import { waitUntil } from 'async-wait-until';
import './global.css';

type LodashGlobal = typeof import('lodash');
type VueGlobal = typeof import('vue');
type ZodGlobal = typeof import('zod');

declare global {
  interface Window {
    Vue?: VueGlobal;
    _: LodashGlobal;
    z?: ZodGlobal;
  }
}

function shouldUseMockPreview() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.has('mock') ||
    typeof Mvu === 'undefined' ||
    typeof getVariables !== 'function' ||
    typeof waitGlobalInitialized !== 'function'
  );
}

async function ensureMockGlobals() {
  if (!window.Vue) {
    window.Vue = await import(/* webpackIgnore: true */ 'https://testingcf.jsdelivr.net/npm/vue/+esm');
  }
  if (!window._) {
    const lodash_module = await import(/* webpackIgnore: true */ 'https://testingcf.jsdelivr.net/npm/lodash/+esm');
    window._ = (lodash_module.default ?? lodash_module) as LodashGlobal;
  }
  if (!window.z) {
    const zod_module = await import(/* webpackIgnore: true */ 'https://testingcf.jsdelivr.net/npm/zod/+esm');
    window.z = zod_module;
  }
}

async function mountStatusBar() {
  const is_mock = shouldUseMockPreview();
  if (is_mock) {
    await ensureMockGlobals();
    document.documentElement.dataset.statusMock = 'true';
  } else {
    await waitGlobalInitialized('Mvu');
    await waitUntil(() => _.has(getVariables({ type: 'message' }), 'stat_data'));
  }

  const [{ default: App }, { createStatusPinia }] = await Promise.all([import('./App.vue'), import('./store')]);
  const vue = window.Vue;
  if (!vue) {
    throw Error('Vue 未初始化，状态栏无法挂载。');
  }
  vue.createApp(App).use(createStatusPinia()).mount('#app');
}

function startWhenReady() {
  if (typeof $ === 'function') {
    $(mountStatusBar);
    return;
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      void mountStatusBar();
    });
    return;
  }
  void mountStatusBar();
}

startWhenReady();

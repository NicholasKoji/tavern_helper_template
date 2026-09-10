import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { klona } from 'klona';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { z } from 'zod';

function loadTypeScript(path, imports = {}, globals = {}) {
  const context = {
    exports: {},
    require: name => imports[name] ?? {},
    console,
    ...globals,
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(path, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  return context.exports;
}

const styles = loadTypeScript('src/剧情生图/style-presets.ts', {
  './style-reference': { B2_STYLE_REFERENCE: 'data:image/png;base64,STYLE' },
  './types': {},
});

assert.equal(styles.NANO_BANANA_STYLE_PRESETS.length, 7);
assert.equal(styles.GPT_IMAGE_STYLE_PRESETS.length, 7);
for (const preset of styles.NANO_BANANA_STYLE_PRESETS) {
  assert.ok(preset.plannerHint.trim(), `${preset.id} planner hint`);
  assert.ok(preset.prompt.trim(), `${preset.id} prompt`);
  assert.match(preset.id, /-nano-banana$/);
  assert.doesNotMatch(preset.label, /^[A-Z]\d? ·/);
}
for (const preset of styles.GPT_IMAGE_STYLE_PRESETS) {
  assert.ok(preset.plannerHint.trim(), `${preset.id} planner hint`);
  assert.ok(preset.prompt.trim(), `${preset.id} prompt`);
  assert.match(preset.id, /-gpt-image$/);
  assert.doesNotMatch(preset.label, /^[A-Z]\d? ·/);
  assert.match(preset.prompt, /Content priority:/);
}
assert.match(styles.getStylePreset('nano-banana', 'anime-film-nano-banana').prompt, /Makoto Shinkai/);
assert.doesNotMatch(styles.getStylePreset('gpt-image', 'cinematic-anime-gpt-image').prompt, /Makoto Shinkai/);
assert.doesNotMatch(styles.getStylePreset('gpt-image', 'action-illustration-gpt-image').prompt, /Solo Leveling/);
assert.doesNotMatch(styles.getStylePreset('gpt-image', 'stylized-cinematic-cg-gpt-image').prompt, /GANTZ/);
assert.equal(styles.getStylePreset('gpt-image', 'missing'), undefined);
const referencedStyle = styles.getStylePreset('nano-banana', 'refined-female-webtoon-nano-banana');
assert.ok(referencedStyle.styleReference?.imageUrl);
assert.equal(
  styles.GPT_IMAGE_STYLE_PRESETS.some(preset => preset.styleReference),
  false,
);

const settingsModule = loadTypeScript('src/剧情生图/settings.ts', {
  zod: { z },
  pinia: { defineStore },
  vue: { ref, watch },
  klona: { klona },
  './types': {},
  './style-presets': { DEFAULT_STYLE_PRESET_IDS: styles.DEFAULT_STYLE_PRESET_IDS },
});
const defaultSettings = settingsModule.StoryImageSettingsSchema.parse({});
assert.equal(defaultSettings.provider.modelAdaptation, 'nano-banana');
assert.equal(defaultSettings.schemaVersion, 3);
assert.equal(defaultSettings.visual.styleByModel['nano-banana'].presetId, 'douyin-beauty-nano-banana');
assert.equal(defaultSettings.visual.styleByModel['gpt-image'].presetId, 'bright-fashion-photo-gpt-image');
assert.throws(
  () => settingsModule.StoryImageSettingsSchema.parse({ provider: { modelAdaptation: 'auto' } }),
  /modelAdaptation/,
);
assert.deepEqual(
  { ...settingsModule.migrateLegacyStyleSelection('B2', '补充', 'nano-banana') },
  {
    presetId: 'refined-female-webtoon-nano-banana',
    custom: '补充',
  },
);
assert.deepEqual(
  { ...settingsModule.migrateLegacyStyleSelection('B2', '补充', 'gpt-image') },
  {
    presetId: 'refined-character-webtoon-gpt-image',
    custom: '补充',
  },
);
assert.deepEqual(
  { ...settingsModule.migrateLegacyStyleSelection('古典油画质感', '厚涂', 'gpt-image') },
  {
    presetId: 'custom',
    custom: '古典油画质感\n厚涂',
  },
);

const planner = loadTypeScript('src/剧情生图/planner.ts', {
  './style-presets': styles,
  './reference-library': {},
  './message-state': {},
  './character-specialization': {},
  './renderer': {},
  './planner-text': {},
  './mvu-state': {},
});

const settings = {
  provider: { modelAdaptation: 'gpt-image' },
  canvas: { aspectRatioPreset: '2:3', customAspectRatio: '', sizePreset: '1024x1536', customSize: '' },
  visual: {
    maxVisiblePeople: 2,
    compositionPreset: '',
    compositionCustom: '',
    styleByModel: {
      'nano-banana': { presetId: 'douyin-beauty-nano-banana', custom: '' },
      'gpt-image': { presetId: 'bright-fashion-photo-gpt-image', custom: '' },
    },
    lightingPreset: '',
    lightingCustom: '',
    qualityPreset: '',
    qualityCustom: '',
    globalRequirements: '',
    avoidRequirements: '',
  },
};

const plannerRequirements = planner.assembleVisualRequirements(settings, true);
assert.match(plannerRequirements, /明亮时尚写真/);
assert.doesNotMatch(plannerRequirements, /Content priority:/);

const finalRequirements = planner.assembleVisualRequirements(settings, false);
assert.match(finalRequirements, /short-video beauty photography/);
assert.match(finalRequirements, /Content priority:/);
assert.doesNotMatch(finalRequirements, /East Asian influencer/);

settings.provider.modelAdaptation = 'nano-banana';
const legacyRequirements = planner.assembleVisualRequirements(settings, false);
assert.match(legacyRequirements, /East Asian influencer/);
assert.doesNotMatch(legacyRequirements, /Content priority:/);

const settingsUi = fs.readFileSync('src/剧情生图/设置界面.vue', 'utf8');
const modelIndex = settingsUi.indexOf('<label>生图模型 (Model)</label>');
const adaptationIndex = settingsUi.indexOf('<label>模型适配</label>');
const canvasTabIndex = settingsUi.indexOf('<!-- TAB 2: 画布与视觉 -->');
assert.ok(modelIndex >= 0 && adaptationIndex > modelIndex && canvasTabIndex > adaptationIndex);
const adaptationBlock = settingsUi.slice(adaptationIndex, settingsUi.indexOf('<!-- 高级接口展开 -->', adaptationIndex));
assert.match(adaptationBlock, /GPT Image/);
assert.match(adaptationBlock, /Nano Banana/);
assert.doesNotMatch(adaptationBlock, /自动/);
const styleOptionsBlock = settingsUi.slice(
  settingsUi.indexOf('<!-- 风格要求 -->'),
  settingsUi.indexOf('<!-- 光线与色彩 -->'),
);
assert.match(styleOptionsBlock, /activeStylePresets/);
assert.doesNotMatch(styleOptionsBlock, /电影感叙事插画|古典油画质感|赛博朋克科幻风|水墨国风意境/);

const requestBodies = [];
const providers = loadTypeScript(
  'src/剧情生图/providers.ts',
  {
    './reference-library': { referenceDataUrl: async url => url },
    './style-presets': styles,
    './types': {},
  },
  {
    fetch: async (_url, init) => {
      requestBodies.push(JSON.parse(init.body));
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { images: [{ image_url: { url: 'https://example.test/result.png' } }] } }],
        }),
      };
    },
  },
);

const providerSettings = {
  provider: {
    protocol: 'chat-completions',
    modelAdaptation: 'gpt-image',
    endpoint: 'https://example.test/v1/chat/completions',
    apiKey: '',
    model: 'gpt-image-test',
  },
  canvas: { sizePreset: '1024x1536', customSize: '' },
  visual: {
    styleByModel: {
      'nano-banana': { presetId: 'douyin-beauty-nano-banana', custom: '' },
      'gpt-image': { presetId: 'bright-fashion-photo-gpt-image', custom: '' },
    },
  },
};
await providers.requestImageGeneration('当前剧情', providerSettings, undefined, [
  { label: '角色身份参考', url: 'data:image/png;base64,FACE' },
]);
const gptContent = requestBodies.at(-1).messages[0].content;
assert.deepEqual(
  Array.from(gptContent, part => part.type),
  ['text', 'text', 'image_url', 'text'],
);
assert.match(gptContent.at(-1).text, /剧情面部重绘协议/);
assert.match(gptContent.at(-1).text, /唯一动态目标/);
assert.match(gptContent.at(-1).text, /重新构建并渲染整张脸/);
assert.doesNotMatch(gptContent.at(-1).text, /至少有三项/);

await providers.requestImageGeneration(
  '全身参考图',
  providerSettings,
  undefined,
  [{ label: '面部身份来源', url: 'data:image/png;base64,FACE' }],
  { referencePromptMode: 'full-body-reference' },
);
const fullBodyContent = requestBodies.at(-1).messages[0].content;
assert.deepEqual(
  Array.from(fullBodyContent, part => part.type),
  ['text', 'text', 'image_url', 'text'],
);
assert.match(fullBodyContent.at(-1).text, /全身参考图面部重绘协议/);
assert.match(fullBodyContent.at(-1).text, /至少有三项与输入图明显不同/);
assert.match(fullBodyContent.at(-1).text, /整张脸必须在新状态下重新渲染/);
assert.match(fullBodyContent.at(-1).text, /并非输入图中的同一拍摄瞬间/);

providerSettings.provider.modelAdaptation = 'nano-banana';
await providers.requestImageGeneration('当前剧情', providerSettings, undefined, [
  { label: '角色身份参考', url: 'data:image/png;base64,FACE' },
]);
const nanoContent = requestBodies.at(-1).messages[0].content;
assert.equal(nanoContent.at(-1).type, 'image_url');

const plannerSource = fs.readFileSync('src/剧情生图/planner.ts', 'utf8');
assert.match(plannerSource, /无论是否绑定参考图，为每个面部可见的角色写出/);
assert.match(plannerSource, /story-image-planner-v8-director-scenes/);
assert.match(plannerSource, /机位高度与观察方向、人物在画面中的位置、裁切到哪里/);
assert.match(plannerSource, /可见双手分别在做什么、放在哪里/);
assert.match(plannerSource, /转脸、侧倾、俯仰和眼球视线是不同状态/);
assert.match(plannerSource, /不把“头颈竖直、平视、嘴唇轻闭”变成通用姿势/);
assert.match(plannerSource, /发现冲突直接改写为一套符合剧情的状态/);
assert.match(plannerSource, /光源方向、软硬与人物受光面/);
assert.doesNotMatch(plannerSource, /动作、场景大致成立即可|以大致成立、姿态自然为目标/);
const referenceUiSource = fs.readFileSync('src/剧情生图/ReferenceLibrary.vue', 'utf8');
assert.match(referenceUiSource, /这不是待扩展的原始画布/);
assert.match(referenceUiSource, /referencePromptMode: kind === 'body' \? 'full-body-reference' : 'scene'/);

console.log('STORY_IMAGE_MODEL_ADAPTATION_AND_STYLE_PRESETS_OK');

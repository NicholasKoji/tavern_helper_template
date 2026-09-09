import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const clone = value => structuredClone(value);
const tick = () => new Promise(resolve => setImmediate(resolve));
function fixture() {
  let chat = 'chat-a';
  let swipe = 0;
  let active = 0;
  let maximum = 0;
  const requests = [];
  const callbacks = new Map();
  let state = {
    status: 'planned',
    sourceFingerprint: 'story',
    operationVersion: 1,
    history: [],
    scenes: [1, 2, 3].map(n => ({
      sceneId: `v1_s${n}`,
      scenePrompt: `scene-${n}`,
      sceneSummary: `Scene ${n}`,
      characterIds: [`character-${n}`],
      referenceFraming: 'full',
      status: 'planned',
      sourceFingerprint: 'story',
      operationVersion: 1,
      history: [],
    })),
  };
  let provider = async prompt => {
    if (prompt === 'scene-2') throw Error('intentional image failure');
    return { kind: 'url', url: prompt };
  };
  const settings = { enabled: true, provider: { timeoutMs: 5000 } };
  const imports = {
    klona: { klona: clone },
    './settings': { useStoryImageSettingsStore: () => ({ settings }) },
    './message-state': {
      getSwipeState: () => clone(state),
      getMessageCurrentSwipeId: () => swipe,
      getMessageText: () => 'story',
      createSourceFingerprint: x => x,
      updateSwipeState: async (_m, _s, update, expected) => {
        if (expected !== chat) return;
        state = update(clone(state));
        return clone(state);
      },
    },
    './renderer': { renderSlot: (_m, _s, scene, callback) => callbacks.set(scene.sceneId, callback) },
    './planner': { assembleFinalPrompt: x => x },
    './reference-library': { selectCharacterReferences: ids => ids },
    './providers': {
      requestImageGeneration: async (prompt, _settings, signal, references) => {
        requests.push({ prompt, references });
        active++;
        maximum = Math.max(maximum, active);
        try {
          return await provider(prompt, signal);
        } finally {
          active--;
        }
      },
    },
    './storage': { uploadImageToTavern: async image => ({ path: image.url, collapsed: false }) },
  };
  const context = {
    exports: {},
    require: name => {
      assert.ok(imports[name], name);
      return imports[name];
    },
    console,
    setTimeout,
    clearTimeout,
    AbortController,
    Map,
    Set,
    Promise,
    SillyTavern: { getCurrentChatId: () => chat },
    retrieveDisplayedMessage: () => undefined,
    toastr: {
      error: e => {
        throw Error(e);
      },
      info: () => {},
    },
  };
  const source = fs.readFileSync('src/剧情生图/scene-tasks.ts', 'utf8');
  vm.runInNewContext(
    ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
      .outputText,
    context,
  );
  return {
    api: context.exports,
    requests,
    callbacks,
    state: () => state,
    max: () => maximum,
    setProvider: p => {
      provider = p;
    },
    setChat: c => {
      chat = c;
    },
    setSwipe: s => {
      swipe = s;
    },
  };
}

// Sequential processing, reference isolation, failure continuation, no overwrite of sibling images.
{
  const f = fixture();
  await f.api.generateScenes(1, 0);
  assert.equal(f.max(), 1);
  assert.deepEqual(
    f.requests.map(r => r.prompt),
    ['scene-1', 'scene-2', 'scene-3'],
  );
  assert.deepEqual(
    f.requests.map(r => Array.from(r.references)),
    [['character-1'], ['character-2'], ['character-3']],
  );
  assert.deepEqual(
    f.state().scenes.map(s => s.status),
    ['ready', 'error', 'ready'],
  );
  assert.equal(f.state().scenes[0].currentImage.path, 'scene-1');
  assert.equal(f.state().scenes[2].currentImage.path, 'scene-3');
  f.setProvider(async prompt => ({ url: prompt + '-retry' }));
  await f.api.generateScenes(1, 0);
  assert.equal(f.requests.length, 4); // Completed scenes are not generated again.
  assert.equal(f.state().scenes[1].currentImage.path, 'scene-2-retry');
  f.callbacks.get('v1_s2')('save-prompt', 'edited-scene-2');
  await tick();
  assert.equal(f.state().scenes[1].scenePrompt, 'edited-scene-2');
  assert.equal(f.state().scenes[1].history.length, 1);
  assert.equal(f.state().scenes[1].currentImage, undefined);
  assert.equal(f.state().scenes[0].currentImage.path, 'scene-1');
}

// Cancel a queued scene while the first request is running; the third still runs.
{
  const f = fixture();
  let release;
  f.setProvider(prompt =>
    prompt === 'scene-1'
      ? new Promise(resolve => {
          release = () => resolve({ url: prompt });
        })
      : Promise.resolve({ url: prompt }),
  );
  const pending = f.api.generateScenes(1, 0);
  await tick();
  f.callbacks.get('v1_s2')('cancel');
  await tick();
  release();
  await pending;
  assert.deepEqual(
    f.requests.map(r => r.prompt),
    ['scene-1', 'scene-3'],
  );
  assert.equal(f.state().scenes[1].status, 'planned');
}

// A late result after cancellation is discarded, and abandoned queue states recover.
{
  const f = fixture();
  let release;
  f.setProvider(
    () =>
      new Promise(resolve => {
        release = () => resolve({ url: 'late-image' });
      }),
  );
  const pending = f.api.generateScenes(1, 0);
  await tick();
  f.api.cancelSceneJobs();
  release();
  await pending;
  await f.api.recoverScenes(1, 0);
  assert.equal(f.requests.length, 1);
  assert.ok(f.state().scenes.every(s => !s.currentImage && s.status === 'planned'));
}

// Switching Swipe before a queued request begins must not generate for the old page.
{
  const f = fixture();
  f.setSwipe(1);
  await f.api.generateScenes(1, 0);
  assert.equal(f.requests.length, 0);
}
console.log('SCENE_QUEUE_TESTS_OK');

// Planner contract: independent anchors and character references, ordered in narrative sequence.
{
  const imports = {
    './renderer': {
      normalizeSearchText: s => s.replace(/\s+/g, ' ').trim(),
      findOccurrenceOffsets: (s, quote) => {
        const offsets = [];
        let i = -1;
        while ((i = s.indexOf(quote, i + 1)) >= 0) offsets.push(i);
        return offsets;
      },
    },
  };
  const context = { exports: {}, require: name => imports[name] ?? {}, console };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/剧情生图/planner.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  const validate = context.exports.validatePlannerScenes;
  const settings = { planner: { sceneCount: 3 }, visual: { maxVisiblePeople: 2 } };
  const entry = quote => ({
    anchor: { quote, occurrence: 1, placement: 'after' },
    scene_summary: quote,
    scene_prompt: '独立画面',
    character_ids: ['a'],
    reference_framing: 'half',
  });
  const input = { scenes: [entry('转身'), entry('递茶')] };
  const result = validate(input, '她递茶，然后转身。', [{ id: 'a' }], settings);
  assert.deepEqual(
    Array.from(result, x => x.anchor.quote),
    ['递茶', '转身'],
  );
  assert.throws(
    () => validate({ scenes: [entry('递茶'), entry('递茶')] }, '她递茶', [{ id: 'a' }], settings),
    /相同锚点/,
  );
  assert.throws(() => validate({ scenes: [entry('不存在')] }, '她递茶', [{ id: 'a' }], settings), /未在可用锚点/);
  assert.throws(() => validate(input, '她递茶，然后转身', [], settings), /无效角色/);
  assert.throws(
    () => validate(input, '她递茶，然后转身', [{ id: 'a' }], { ...settings, planner: { sceneCount: 1 } }),
    /超过请求数量/,
  );
  assert.equal(validate({ scenes: [entry('递茶')] }, '她递茶', [{ id: 'a' }], settings).length, 1);
  console.log('PLANNER_SCENES_TESTS_OK');
}

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const clone = value => structuredClone(value);

function loadReferenceLibraryFixture() {
  const globalVariables = {};
  const characterVariables = {
    story_image_reference_library_v1: {
      enabled: true,
      characters: [{ id: 'legacy', name: '旧角色', aliases: [], description: '旧描述' }],
    },
  };
  const state = {
    name: ' 测试　角色 ',
    avatar: 'old-card.png',
  };
  const context = {
    exports: {},
    console,
    structuredClone,
    getCurrentCharacterName: () => state.name,
    getVariables: ({ type }) => (type === 'global' ? globalVariables : characterVariables),
    updateVariablesWith: (updater, { type }) => {
      assert.equal(type, 'global');
      return updater(globalVariables);
    },
    SillyTavern: {
      characterId: '0',
      characters: [{ avatar: state.avatar, name: state.name }],
    },
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/剧情生图/reference-library.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  return { api: context.exports, globalVariables, characterVariables, state, context };
}

{
  const f = loadReferenceLibraryFixture();
  assert.equal(f.api.normalizeReferenceLibraryName(' 测试　角色 '), '测试 角色');
  assert.equal(f.api.referenceLibraryKey(), 'name:测试 角色');

  const migrated = f.api.loadReferenceLibrary();
  assert.equal(migrated.characters[0].name, '旧角色');
  assert.equal(migrated.characters[0].outfitStyle, 'follow-character');
  assert.equal(migrated.characters[0].photoStyle, 'auto');
  assert.equal(f.globalVariables.story_image_v1.referenceLibraries['name:测试 角色'].characters[0].id, 'legacy');

  f.state.avatar = 'new-card.png';
  f.context.SillyTavern.characters[0].avatar = f.state.avatar;
  delete f.characterVariables.story_image_reference_library_v1;
  const rebound = f.api.loadReferenceLibrary();
  assert.equal(rebound.characters[0].id, 'legacy');

  assert.throws(
    () => f.api.saveReferenceLibrary(clone(rebound), 'old-card.png'),
    /角色卡已变化/,
    'stale generation owner must not save into the newly opened card',
  );

  const references = f.api.selectCharacterReferences(['character-a'], 'full', {
    enabled: true,
    characters: [
      {
        id: 'character-a',
        name: '角色甲',
        aliases: [],
        description: '稳定身份',
        face: 'face.png',
        body: 'body.png',
        bodyFace: 'face.png',
      },
    ],
  });
  assert.equal(references.length, 2);
  assert.match(references[0].label, /表情、嘴型、目光、头部朝向/);
  assert.match(references[0].label, /当前画面必须按剧情重新设计/);
  assert.match(references[1].label, /只保持稳定体型与身体比例/);
  assert.match(references[1].label, /表情、嘴型、目光、头部朝向/);
}

{
  const context = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync('src/剧情生图/reference-presets.ts', 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText,
    context,
  );
  assert.equal(context.exports.REFERENCE_OUTFIT_STYLES.length, 19);
  assert.equal(context.exports.REFERENCE_PHOTO_STYLES.length, 16);
  assert.match(context.exports.resolveReferenceOutfitStyle('intellectual-elegance'), /商务通勤模板/);
  assert.doesNotMatch(
    context.exports.resolveReferenceOutfitStyle('intellectual-elegance', '不应混入的旧自定义内容'),
    /不应混入/,
  );
  assert.equal(context.exports.resolveReferencePhotoStyle('custom', '自定义动作'), '自定义动作');
}

console.log('REFERENCE_LIBRARY_MIGRATION_AND_PRESETS_TESTS_OK');

import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const context = {
  exports: {},
  AbortController,
  SillyTavern: { getRequestHeaders: () => ({ 'X-CSRF-Token': 'fixture' }) },
};
vm.runInNewContext(
  ts.transpileModule(fs.readFileSync('src/剧情生图/gallery.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
  context,
);
const { galleryFromFiles, currentChatImages, loadGallery } = context.exports;
const story = 'story-image-chat-a-2-0-1790000000000.png';
const older = 'story-image-chat-b-1-1-1780000000000.webp';
const reference = 'story-image-reference-library-0-0-1785000000000.png';
const unknown = '历史 + 图.png';
const state = { currentImage: { path: `user/images/story_image/${story}` }, history: [{ path: older }], scenes: [] };
const chat = currentChatImages([
  {
    message_id: 2,
    extra: {
      story_image_v1: {
        version: 1,
        swipes: {
          0: { scenes: [state] },
          1: { history: [{ path: older }] },
        },
      },
    },
  },
]);
assert.equal(chat.size, 2);
assert.equal(chat.get(older), 2);
// Unknown filenames keep their server-supplied timestamp position, not an invented timestamp.
const files = [unknown, story, reference, older, story];
const gallery = galleryFromFiles(files, chat);
assert.deepEqual(
  Array.from(gallery, x => x.name),
  files.slice(0, 4),
);
assert.deepEqual(
  Array.from(gallery, x => x.kind),
  ['other', 'story', 'reference', 'story'],
);
assert.equal(gallery[0].path, `user/images/story_image/${encodeURIComponent(unknown)}`);
assert.equal(gallery[1].createdAt, 1790000000000);
assert.equal(gallery[2].messageId, undefined);
assert.equal(gallery[3].messageId, 2);
const signal = new AbortController().signal;
context.fetch = async (url, init) => {
  assert.equal(url, '/api/images/list');
  assert.equal(init.signal, signal);
  assert.equal(init.headers['X-CSRF-Token'], 'fixture');
  assert.deepEqual(JSON.parse(init.body), { folder: 'story_image', sortField: 'date', sortOrder: 'desc' });
  return { ok: true, json: async () => files };
};
assert.deepEqual(await loadGallery(signal), files);
context.fetch = async () => ({ ok: false, status: 403 });
await assert.rejects(loadGallery(signal), /403/);
context.fetch = async () => ({ ok: true, json: async () => ({ files }) });
await assert.rejects(loadGallery(signal), /格式异常/);
console.log(
  'GALLERY_DATA_TESTS_OK: server date-desc, all kinds, deduplication, swipes/scenes/history, encoding, API errors',
);

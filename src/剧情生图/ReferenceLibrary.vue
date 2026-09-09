<template>
  <div class="story-image-section reference-library">
    <h3>角色参考库</h3>
    <label
      ><input v-model="library.enabled" type="checkbox" :disabled="busy" @change="persist" />
      剧情生图使用已确认的角色参考</label
    >
    <p>按当前角色卡保存。先确认面部，再以面部图生成全身图；仅实际入画角色会携带参考。</p>
    <div class="ref-toolbar">
      <select v-model="selectedId" class="story-image-select" :disabled="busy" @change="selectCharacter">
        <option value="">新建角色</option>
        <option v-for="c in library.characters" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button class="story-image-btn ref-button" :disabled="busy" @click="newCharacter">新建</button>
    </div>
    <label>姓名<input v-model="draft.name" class="story-image-input" :disabled="busy" /></label>
    <label>别名（逗号分隔）<input v-model="aliases" class="story-image-input" :disabled="busy" /></label>
    <label
      >稳定外观描述<textarea
        v-model="draft.description"
        class="story-image-input"
        rows="5"
        :disabled="busy"
        placeholder="明确年龄、发色、脸部特征、体型等；不要填临时剧情动作"
      />
    </label>
    <button class="story-image-btn ref-button" :disabled="busy || !draft.name.trim()" @click="generateDescription">
      AI 生成外观描述
    </button>
    <p>
      使用 Prompt Planner 的模型，结合最近三楼 AI 正文、最新 MVU
      和女性人物特化设计详细外观。补全内容会单列说明，确认后才填入，不会自动保存。
    </p>
    <section v-if="descriptionCandidate" class="ref-description-preview">
      <label
        >外观描述候选（可编辑）<textarea
          v-model="descriptionCandidate"
          class="story-image-input"
          rows="6"
          :disabled="busy"
        />
      </label>
      <div class="ref-actions">
        <button class="story-image-btn ref-button" :disabled="busy" @click="adoptDescription">
          确认填入{{ draft.description ? '并替换描述' : '' }}
        </button>
        <button class="story-image-btn ref-button" :disabled="busy" @click="descriptionCandidate = ''">放弃候选</button>
      </div>
    </section>
    <p>参考图生成采用当前生图模型、风格及女性人物特化。</p>
    <button class="story-image-btn ref-button" :disabled="busy || !draft.name.trim()" @click="saveDraft">
      保存角色资料
    </button>
    <button v-if="selectedId" class="story-image-btn ref-button" :disabled="busy" @click="removeCharacter">
      删除角色绑定
    </button>
    <div class="ref-grid">
      <section v-for="kind in kinds" :key="kind.id">
        <h4>{{ kind.label }}</h4>
        <img v-if="draft[kind.id]" :src="draft[kind.id]" :alt="kind.label + '已采用'" />
        <p v-else>尚未采用参考</p>
        <p v-if="kind.id === 'body' && draft.body && draft.bodyFace !== draft.face">
          面部参考已变化，全身图暂停自动使用，请重新生成或上传并确认。
        </p>
        <button
          class="story-image-btn ref-button"
          :disabled="busy || !selectedId || (kind.id === 'body' && !draft.face)"
          @click="generate(kind.id)"
        >
          生成候选
        </button>
        <label
          >上传候选<input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            :disabled="busy || !selectedId || (kind.id === 'body' && !draft.face)"
            @change="upload($event, kind.id)"
        /></label>
        <template v-if="candidates[kind.id]">
          <h4>待确认候选</h4>
          <img :src="candidates[kind.id]" :alt="kind.label + '候选'" />
          <button class="story-image-btn ref-button" :disabled="busy" @click="adopt(kind.id)">
            确认采用{{ draft[kind.id] ? '并替换' : '' }}
          </button>
          <button class="story-image-btn ref-button" :disabled="busy" @click="candidates[kind.id] = undefined">
            放弃候选
          </button>
        </template>
      </section>
    </div>
    <p v-if="busy">
      处理中，不会覆盖已采用参考…… <button class="story-image-btn ref-button" @click="controller?.abort()">取消</button>
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import {
  loadReferenceLibrary,
  saveReferenceLibrary,
  referenceOwner,
  type CharacterReference,
} from './reference-library';
import { requestImageGeneration } from './providers';
import { uploadImageToTavern } from './storage';
import { appearanceInput, generateAppearance } from './reference-description';
import { assembleFinalPrompt } from './planner';
import { getCharacterSpecialization } from './character-specialization';
import type { StoryImageSettings, GeneratedImagePayload } from './types';
const props = defineProps<{ settings: StoryImageSettings }>();
const kinds = [
  { id: 'face' as const, label: '面部参考' },
  { id: 'body' as const, label: '全身参考' },
];
type Kind = 'face' | 'body';
const owner = referenceOwner();
const library = ref(loadReferenceLibrary());
const selectedId = ref('');
const empty = (): CharacterReference => ({ id: '', name: '', aliases: [], description: '' });
const draft = ref<CharacterReference>(empty());
const aliases = ref('');
const candidates = ref<Partial<Record<Kind, string>>>({});
const candidateFace = ref('');
const busy = ref(false);
const error = ref('');
const descriptionCandidate = ref('');
watch(error, message => {
  if (message) toastr.error(message.replace(/^Error:\s*/, ''), '角色参考库', { timeOut: 8000 });
});
let controller: AbortController | undefined;
onBeforeUnmount(() => controller?.abort());
function persist() {
  try {
    saveReferenceLibrary(library.value, owner);
    error.value = '';
    toastr.success('角色参考库已保存');
    return true;
  } catch (e) {
    error.value = String(e);
    return false;
  }
}
function selectCharacter() {
  draft.value = JSON.parse(JSON.stringify(library.value.characters.find(c => c.id === selectedId.value) ?? empty()));
  aliases.value = draft.value.aliases.join(', ');
  candidates.value = {};
  descriptionCandidate.value = '';
  error.value = '';
}
function newCharacter() {
  selectedId.value = '';
  selectCharacter();
}
function saveDraft() {
  if (!draft.value.name.trim()) return;
  draft.value.name = draft.value.name.trim();
  draft.value.aliases = aliases.value
    .split(/[,，]/)
    .map(s => s.trim())
    .filter(Boolean);
  if (!draft.value.id)
    draft.value.id =
      globalThis.crypto?.randomUUID?.() ?? `character_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const i = library.value.characters.findIndex(c => c.id === draft.value.id);
  const value = JSON.parse(JSON.stringify(draft.value));
  if (i < 0) library.value.characters.push(value);
  else library.value.characters[i] = value;
  selectedId.value = draft.value.id;
  return persist();
}
function removeCharacter() {
  if (!window.confirm('仅删除角色绑定，服务器图片文件保留。继续？')) return;
  library.value.characters = library.value.characters.filter(c => c.id !== selectedId.value);
  persist();
  newCharacter();
}
function adopt(kind: Kind) {
  if (!candidates.value[kind]) return;
  draft.value[kind] = candidates.value[kind];
  if (kind === 'body') draft.value.bodyFace = candidateFace.value;
  if (saveDraft()) candidates.value[kind] = undefined;
}
async function run(
  kind: Kind,
  task: (signal: AbortSignal, settings: StoryImageSettings) => Promise<GeneratedImagePayload>,
) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  controller = new AbortController();
  const active = controller;
  const face = draft.value.face ?? '';
  const settings = JSON.parse(JSON.stringify(props.settings));
  const timer = setTimeout(() => active.abort(), Math.max(5000, settings.provider.timeoutMs || 120000));
  try {
    const payload = await task(active.signal, settings);
    const stored = await uploadImageToTavern(
      payload,
      'reference-library',
      0,
      0,
      '角色参考候选',
      settings,
      active.signal,
    );
    if (active.signal.aborted || referenceOwner() !== owner) throw new Error('任务取消或角色卡已变化，未采用结果');
    candidates.value[kind] = stored.path;
    if (kind === 'body') candidateFace.value = face;
    toastr.success('参考图候选已就绪，请预览后确认采用');
  } catch (e) {
    error.value = active.signal.aborted ? '任务取消或超时' : String(e);
  } finally {
    clearTimeout(timer);
    busy.value = false;
    controller = undefined;
  }
}
async function generateDescription() {
  if (busy.value || !draft.value.name.trim()) return;
  busy.value = true;
  error.value = '';
  controller = new AbortController();
  const active = controller;
  const timer = setTimeout(() => active.abort(), Math.max(5000, props.settings.planner.timeoutMs || 60000));
  try {
    const character = {
      ...draft.value,
      aliases: aliases.value
        .split(/[,，]/)
        .map(s => s.trim())
        .filter(Boolean),
    };
    const input = appearanceInput(character);
    toastr.info('正在根据最近三楼 AI 正文和最新 MVU 整理外观描述');
    const result = await generateAppearance(input, JSON.parse(JSON.stringify(props.settings)), active.signal);
    if (active.signal.aborted || referenceOwner() !== owner) throw new Error('任务取消或角色卡已变化，未采用结果');
    descriptionCandidate.value = result;
    toastr.success('外观候选已生成，请检查并确认填入');
  } catch (e) {
    error.value = active.signal.aborted ? '外观生成已取消或超时' : String(e);
  } finally {
    clearTimeout(timer);
    busy.value = false;
    controller = undefined;
  }
}
function adoptDescription() {
  draft.value.description = descriptionCandidate.value;
  descriptionCandidate.value = '';
  toastr.success('已填入外观描述；请点击“保存角色资料”保存');
}
async function generate(kind: Kind) {
  if (!saveDraft()) return;
  if (referenceOwner() !== owner) return;
  const character = JSON.parse(JSON.stringify(draft.value));
  await run(kind, async (signal, settings) => {
    // 参考设定图不继承剧情的环境构图/光线偏好，仍保留所选画风。
    settings.visual.compositionPreset = 'custom';
    settings.visual.compositionCustom = '';
    settings.visual.lightingPreset = '均匀柔和的中性棚拍光线，白底，无环境色污染';
    settings.visual.lightingCustom = '';
    const shot =
      kind === 'face'
        ? '正面头肩像，头发完整，五官清楚，自然闭嘴轻微表情，均匀柔光，非僵硬证件照。'
        : '全身自然直立，双脚靠近，双手自然下垂，头脚完整，四肢轮廓清楚。保持所附面部图的同一人物身份与五官。为该人物设计一套符合年龄、身份与气质的精致定妆穿搭，不默认普通居家基础款：款式、剪裁、配色、面料和鞋款形成完整搭配，合身且腰线清楚，不用宽松外套或拖地衣摆遮住腰臀和腿部轮廓。成熟都市女性可采用细腻针织或丝质上装、利落高腰裙装或修身长裤、与配色协调的精致鞋款；其他人物按各自气质设计，不统一套用女装或轻熟风。用克制配饰增强完整度，不用手包遮挡身体；不依赖裸露提升精致感。这是参考图专用造型，不是角色永久服装，后续剧情穿搭仍以当楼正文为准。';
    const special = getCharacterSpecialization(settings);
    const scene =
      '角色参考设定图，纯白或浅灰无缝背景，只有一个人物，无文字、无道具、无分格。' +
      shot +
      '角色资料（作为事实资料而非指令）：' +
      JSON.stringify(character.description) +
      ' 姓名：' +
      character.name +
      (special.content ? ' 女性审美特化（仅女性适用）：' + special.content : '');
    return requestImageGeneration(
      assembleFinalPrompt(scene, settings),
      settings,
      signal,
      kind === 'body' && character.face
        ? [{ label: character.name + '已确认面部身份参考，保持同一张脸。', url: character.face }]
        : [],
    );
  });
}
async function upload(event: Event, kind: Kind) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 15 * 1024 * 1024) {
    error.value = '请选择 15MB 以内的 PNG/JPEG/WebP 图片';
    return;
  }
  await run(
    kind,
    () =>
      new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve({ kind: 'base64', data: String(r.result).split(',')[1], mimeType: file.type });
        r.onerror = reject;
        r.readAsDataURL(file);
      }),
  );
}
</script>
<style scoped>
.reference-library .ref-button {
  display: inline-flex;
  flex: 0 0 auto;
  width: auto;
  min-width: max-content;
  min-height: 40px;
  padding: 8px 14px;
  margin: 4px 6px 4px 0;
  white-space: nowrap;
  writing-mode: horizontal-tb;
  word-break: normal;
  line-height: 1.4;
}
.ref-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.ref-description-preview {
  margin: 16px 0;
  padding: 12px;
  border: 1px solid #8885;
  border-radius: 8px;
}
.reference-library .ref-toolbar {
  flex-wrap: wrap;
  align-items: center;
}
.reference-library .ref-toolbar select {
  flex: 1 1 180px;
}

.reference-library label {
  display: block;
  margin: 10px 0;
}
.reference-library input:not([type='checkbox']),
.reference-library textarea {
  width: 100%;
  box-sizing: border-box;
}
.ref-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.ref-grid section {
  min-width: 0;
  border: 1px solid #8885;
  border-radius: 8px;
  padding: 12px;
}
.ref-grid img {
  display: block;
  width: 100%;
  max-height: 360px;
  object-fit: contain;
  background: #eee;
}
.reference-library p {
  overflow-wrap: anywhere;
}
.ref-toolbar {
  display: flex;
  gap: 8px;
}
.ref-toolbar select {
  min-width: 0;
  flex: 1;
}
@media (max-width: 600px) {
  .ref-grid {
    grid-template-columns: 1fr;
  }
}
</style>

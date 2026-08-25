<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">03 · 角色与关系</div>
      <h2 class="banner-title">主角与重要登场人物</h2>
      <p class="banner-desc">为核心人物赋予明确的身份、性格与关系位置，让场面因人物的碰撞而生动起来。</p>
    </div>

    <!-- 主角档案卡 -->
    <article class="character-dossier-card protagonist-card">
      <header class="card-head">
        <div class="head-left">
          <span class="head-seal">主角</span>
          <div class="head-title-wrap">
            <h3 class="head-name">{{ protagonistName || '当前酒馆玩家角色' }}</h3>
            <span class="head-role-tag">{{ form.主角.身份与位置 || '身份未指定' }}</span>
          </div>
        </div>

        <div class="head-actions">
          <button
            v-if="form.主角.启用"
            class="ai-assist-btn"
            :class="{ 'is-busy': aiBusyKey === 'protagonist' }"
            type="button"
            :disabled="Boolean(aiBusyKey)"
            @click="$emit('assistProtagonist')"
          >
            <Sparkles :size="13" />
            <span>{{ aiBusyKey === 'protagonist' ? '人设生成中…' : '根据人设生成' }}</span>
          </button>

          <label class="switch-toggle" title="是否启用主角作为正文人物">
            <input v-model="form.主角.启用" type="checkbox" role="switch" />
            <span class="switch-slider"></span>
          </label>
        </div>
      </header>

      <div v-if="!form.主角.启用" class="disabled-notice">
        <CircleAlert :size="15" />
        <span>已关闭主角角色：签发时写入空主角骨架，忽略当前主角表单内容。</span>
      </div>

      <div v-else class="card-form-grid">
        <div class="field-row-3">
          <div class="form-item">
            <label class="form-label">性别表达</label>
            <input v-model="form.主角.性别" type="text" class="dossier-input" placeholder="可留空，如：女 / 男" />
          </div>
          <div class="form-item">
            <label class="form-label">年龄阶段</label>
            <input
              :value="form.主角.年龄"
              type="text"
              inputmode="numeric"
              class="dossier-input"
              placeholder="可留空或正整数，如：24"
              @input="onProtagonistAgeInput"
            />
          </div>
          <div class="form-item">
            <label class="form-label">身份与社会位置</label>
            <input
              v-model="form.主角.身份与位置"
              type="text"
              class="dossier-input"
              placeholder="例如：旧书店年轻店主 / 档案馆二级调查员"
            />
          </div>
        </div>

        <div class="field-row-2">
          <div class="form-item">
            <label class="form-label">主动追求的目标</label>
            <input
              v-model="form.主角.追求"
              type="text"
              class="dossier-input"
              placeholder="留空则签发为空，不从第一层主角处境后备填入"
            />
          </div>
          <div class="form-item">
            <label class="form-label">性格主色</label>
            <input
              v-model="form.主角.性格主色"
              type="text"
              class="dossier-input"
              placeholder="例如：压力下会迅速转为尖锐、控制欲强"
            />
          </div>
        </div>

        <div class="field-row-2">
          <div class="form-item">
            <label class="form-label">性格底色与说话风格</label>
            <input
              v-model="form.主角.性格与声音"
              type="text"
              class="dossier-input"
              placeholder="例如：克制冷静、习惯用简短反问回应他人，不轻易动怒"
            />
          </div>
          <div class="form-item">
            <label class="form-label">补充设定与生活痕迹</label>
            <input
              v-model="form.主角.补充设定"
              type="text"
              class="dossier-input"
              placeholder="例如：左手食指有旧墨水烫伤痕迹；从不在雨天出门"
            />
          </div>
        </div>

        <!-- 外貌折叠面板 -->
        <details class="appearance-panel" :open="hasProtagonistAppearance">
          <summary class="appearance-summary">
            <span class="summary-title">
              <Eye :size="14" />
              <span>外貌与身形特征（点击展开/折叠）</span>
            </span>
            <span class="summary-status">{{ hasProtagonistAppearance ? '已填写细节' : '可留空或补充' }}</span>
          </summary>
          <div class="appearance-grid">
            <div class="form-item">
              <label class="form-label">身高比例</label>
              <input v-model="form.主角.外貌.身高" type="text" class="dossier-input" placeholder="如：168cm / 修长" />
            </div>
            <div class="form-item">
              <label class="form-label">体型线条</label>
              <input v-model="form.主角.外貌.体型" type="text" class="dossier-input" placeholder="如：清瘦、骨节分明" />
            </div>
            <div class="form-item">
              <label class="form-label">面容气质</label>
              <input
                v-model="form.主角.外貌.面容气质"
                type="text"
                class="dossier-input"
                placeholder="如：黑发及肩，眼神带着常年熬夜的倦怠感"
              />
            </div>
            <div class="form-item">
              <label class="form-label">身体特征</label>
              <input
                v-model="form.主角.外貌.身体特征"
                type="text"
                class="dossier-input"
                placeholder="如：右腕戴着一串褪色的黄铜钥匙"
              />
            </div>
          </div>
        </details>

        <details class="appearance-panel" :open="hasClothing(form.主角.穿着)">
          <summary class="appearance-summary">
            <span class="summary-title">
              <Shirt :size="14" />
              <span>穿着（点击展开/折叠）</span>
            </span>
            <span class="summary-status">{{ hasClothing(form.主角.穿着) ? '已填写细节' : '配饰默认无' }}</span>
          </summary>
          <div class="appearance-grid clothing-grid">
            <ClothingField v-model="form.主角.穿着.上装" label="上装" placeholder="如：浅色衬衫" />
            <ClothingField v-model="form.主角.穿着.下装" label="下装" placeholder="如：深色长裤" />
            <ClothingField v-model="form.主角.穿着.内衣" label="内衣" placeholder="可留空" />
            <ClothingField v-model="form.主角.穿着.袜子" label="袜子" placeholder="可留空" />
            <ClothingField v-model="form.主角.穿着.鞋子" label="鞋子" placeholder="如：旧皮靴" />
            <ClothingField v-model="form.主角.穿着.配饰" label="配饰" placeholder="无" />
          </div>
        </details>

        <PrivateStatusPanel
          title="私密状态"
          :status="form.主角.私密状态"
          :is-busy="aiBusyKey === 'protagonist.private-status'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          @generate="$emit('assistPrivateStatus', 'protagonist.private-status')"
          @clear="$emit('clearPrivateStatus', 'protagonist.private-status')"
        />
      </div>
    </article>

    <!-- 重要角色 (NPC 序列) -->
    <div class="npc-section-header">
      <div class="npc-header-copy">
        <h3 class="npc-section-title">重要登场角色 (NPC)</h3>
        <p class="npc-section-desc">第一幕聚焦已登记角色，支持随时增删。姓名为空的角色不会写入 NPC序列。</p>
      </div>
      <button class="add-role-btn" type="button" @click="$emit('addCharacter')">
        <Plus :size="14" stroke-width="2.2" />
        <span>添加重要角色</span>
      </button>
    </div>

    <div v-if="!form.重要角色.length" class="empty-npc-banner">
      <Users :size="20" class="empty-icon" />
      <div>
        <strong class="empty-title">尚未登记特定重要角色</strong>
        <p class="empty-desc">你可以点击上方按钮添加主要互动 NPC，或者直接进入下一步由世界背景自然生成。</p>
      </div>
    </div>

    <div v-else class="npc-cards-list">
      <article
        v-for="(character, index) in form.重要角色"
        :key="character.localId"
        class="character-dossier-card npc-card"
      >
        <header class="card-head">
          <div class="head-left">
            <span class="head-seal npc-seal">NPC {{ index + 1 }}</span>
            <div class="head-title-wrap">
              <h3 class="head-name">{{ character.姓名 || `未命名角色 ${index + 1}` }}</h3>
              <span class="head-role-tag">{{ character.关系定位 || '关系未指定' }}</span>
            </div>
          </div>

          <div class="head-actions">
            <button
              class="ai-assist-btn"
              :class="{ 'is-busy': aiBusyKey === `character:${index}` }"
              type="button"
              :disabled="Boolean(aiBusyKey)"
              @click="$emit('assistCharacter', index)"
            >
              <Sparkles :size="13" />
              <span>{{ aiBusyKey === `character:${index}` ? '整理中…' : 'AI 整理角色' }}</span>
            </button>
            <button
              class="del-role-btn"
              type="button"
              :aria-label="`删除角色 ${index + 1}`"
              @click="$emit('removeCharacter', index)"
            >
              <Trash2 :size="15" />
            </button>
          </div>
        </header>

        <div class="card-form-grid">
          <div class="field-row-3">
            <div class="form-item">
              <label class="form-label">姓名</label>
              <input v-model="character.姓名" type="text" class="dossier-input" placeholder="如：林澈" />
            </div>
            <div class="form-item">
              <label class="form-label">性别</label>
              <input v-model="character.性别" type="text" class="dossier-input" placeholder="如：男 / 女" />
            </div>
            <div class="form-item">
              <label class="form-label">年龄</label>
              <input
                :value="character.年龄"
                type="text"
                inputmode="numeric"
                class="dossier-input"
                placeholder="可留空或正整数，如：31"
                @input="onCharacterAgeInput(character, $event)"
              />
            </div>
          </div>

          <div class="field-row-3 npc-profile-row">
            <div class="form-item">
              <label class="form-label">身份</label>
              <input v-model="character.身份" type="text" class="dossier-input" placeholder="如：档案馆调查员" />
            </div>
            <div class="form-item">
              <label class="form-label">与主角的关系定位</label>
              <input v-model="character.关系定位" type="text" class="dossier-input" placeholder="如：长期熟客" />
            </div>
            <div class="form-item favorability-item">
              <div class="favorability-label-row">
                <label class="form-label" :for="`favorability-${character.localId}`">好感度</label>
                <output class="favorability-value">{{ character.好感度 }}</output>
              </div>
              <input
                :id="`favorability-${character.localId}`"
                v-model.number="character.好感度"
                class="favorability-range"
                type="range"
                min="0"
                max="100"
                step="1"
                :aria-valuenow="character.好感度"
                aria-valuemin="0"
                aria-valuemax="100"
              />
              <div class="range-scale"><span>0</span><span>100</span></div>
            </div>
          </div>

          <div class="field-row-2">
            <div class="form-item">
              <label class="form-label">性格主色</label>
              <input
                v-model="character.性格主色"
                type="text"
                class="dossier-input"
                placeholder="如：压力下显露出冒险和攻击性"
              />
            </div>
            <div class="form-item">
              <label class="form-label">性格底色与说话方式</label>
              <input
                v-model="character.性格与声音"
                type="text"
                class="dossier-input"
                placeholder="例如：语气平缓克制，语速慢，习惯先听完再表态"
              />
            </div>
          </div>

          <!-- NPC 外貌折叠面板 -->
          <details class="appearance-panel" :open="hasCharacterAppearance(character)">
            <summary class="appearance-summary">
              <span class="summary-title">
                <Eye :size="14" />
                <span>外貌特征（可选展开）</span>
              </span>
              <span class="summary-status">{{
                hasCharacterAppearance(character) ? '已填写细节' : '可留空或补充'
              }}</span>
            </summary>
            <div class="appearance-grid">
              <div class="form-item">
                <label class="form-label">身高</label>
                <input v-model="character.身高" type="text" class="dossier-input" placeholder="如：182cm" />
              </div>
              <div class="form-item">
                <label class="form-label">体型</label>
                <input v-model="character.体型" type="text" class="dossier-input" placeholder="如：修长匀称" />
              </div>
              <div class="form-item">
                <label class="form-label">面容气质</label>
                <input
                  v-model="character.面容气质"
                  type="text"
                  class="dossier-input"
                  placeholder="如：眉眼狭长，右眉有浅疤"
                />
              </div>
              <div class="form-item">
                <label class="form-label">身体特征</label>
                <input
                  v-model="character.身体特征"
                  type="text"
                  class="dossier-input"
                  placeholder="如：大衣袖口微湿，佩戴银色领夹"
                />
              </div>
              <div class="form-item">
                <label class="form-label">罩杯</label>
                <select v-model="character.罩杯" class="dossier-input dossier-select">
                  <option v-for="cup in cupOptions" :key="cup" :value="cup">{{ cup }}</option>
                </select>
              </div>
            </div>
          </details>

          <details class="appearance-panel" :open="hasClothing(character.穿着)">
            <summary class="appearance-summary">
              <span class="summary-title">
                <Shirt :size="14" />
                <span>穿着（点击展开/折叠）</span>
              </span>
              <span class="summary-status">{{ hasClothing(character.穿着) ? '已填写细节' : '配饰默认无' }}</span>
            </summary>
            <div class="appearance-grid clothing-grid">
              <ClothingField v-model="character.穿着.上装" label="上装" placeholder="如：浅色衬衫" />
              <ClothingField v-model="character.穿着.下装" label="下装" placeholder="如：深色长裤" />
              <ClothingField v-model="character.穿着.内衣" label="内衣" placeholder="可留空" />
              <ClothingField v-model="character.穿着.袜子" label="袜子" placeholder="可留空" />
              <ClothingField v-model="character.穿着.鞋子" label="鞋子" placeholder="如：旧皮靴" />
              <ClothingField v-model="character.穿着.配饰" label="配饰" placeholder="无" />
            </div>
          </details>

          <PrivateStatusPanel
            title="私密状态"
            :status="character.私密状态"
            :is-busy="aiBusyKey === `character:${index}.private-status`"
            :is-any-ai-busy="Boolean(aiBusyKey)"
            :disabled="!character.姓名.trim()"
            :disabled-message="character.姓名.trim() ? '' : '请先填写 NPC 姓名，再生成私密状态。'"
            @generate="$emit('assistPrivateStatus', `character:${index}.private-status`)"
            @clear="$emit('clearPrivateStatus', `character:${index}.private-status`)"
          />
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineComponent, h, type PropType } from 'vue';
import { CircleAlert, Eye, Plus, Shirt, Sparkles, Trash2, Users } from '@lucide/vue';

type ClothingDraft = {
  上装: string;
  下装: string;
  内衣: string;
  袜子: string;
  鞋子: string;
  配饰: string;
};
type PrivateStatusDraft = Record<string, { 外观描述: string; 当前状态: string }>;

const props = defineProps<{
  form: any;
  aiBusyKey: string;
  protagonistName: string;
}>();

defineEmits<{
  (e: 'assistProtagonist'): void;
  (e: 'assistCharacter', index: number): void;
  (e: 'assistPrivateStatus', target: string): void;
  (e: 'clearPrivateStatus', target: string): void;
  (e: 'addCharacter'): void;
  (e: 'removeCharacter', index: number): void;
}>();

const cupOptions = ['不适用', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];

const hasProtagonistAppearance = computed(() => hasCharacterAppearance(props.form.主角));

function hasCharacterAppearance(character: any): boolean {
  return Boolean(
    character.身高 ||
    character.体型 ||
    character.面容气质 ||
    character.身体特征 ||
    (Object.prototype.hasOwnProperty.call(character, '罩杯') && character.罩杯 !== '不适用'),
  );
}

function hasClothing(clothing: ClothingDraft): boolean {
  return Object.entries(clothing).some(([key, value]) => value && (key !== '配饰' || value !== '无'));
}

function privateStatusEntries(status: PrivateStatusDraft) {
  return Object.entries(status) as Array<[string, { 外观描述: string; 当前状态: string }]>;
}

function sanitizePositiveInteger(val: string): string {
  const digits = val.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10);
  return num > 0 ? String(num) : '';
}

function onProtagonistAgeInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const sanitized = sanitizePositiveInteger(target.value);
  target.value = sanitized;
  props.form.主角.年龄 = sanitized;
}

function onCharacterAgeInput(character: any, e: Event) {
  const target = e.target as HTMLInputElement;
  const sanitized = sanitizePositiveInteger(target.value);
  target.value = sanitized;
  character.年龄 = sanitized;
}

const ClothingField = defineComponent({
  name: 'ClothingField',
  props: {
    modelValue: { type: String, default: '' },
    label: { type: String, required: true },
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  setup(fieldProps, { emit }) {
    return () =>
      h('div', { class: 'form-item' }, [
        h('label', { class: 'form-label' }, fieldProps.label),
        h('input', {
          value: fieldProps.modelValue,
          type: 'text',
          class: 'dossier-input',
          placeholder: fieldProps.placeholder,
          onInput: (event: Event) => emit('update:modelValue', (event.target as HTMLInputElement).value),
        }),
      ]);
  },
});

const PrivateStatusPanel = defineComponent({
  name: 'PrivateStatusPanel',
  props: {
    title: { type: String, required: true },
    status: { type: Object as PropType<PrivateStatusDraft>, required: true },
    isBusy: { type: Boolean, default: false },
    isAnyAiBusy: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    disabledMessage: { type: String, default: '' },
  },
  emits: ['generate', 'clear'],
  setup(panelProps, { emit }) {
    const entries = computed(
      () => Object.entries(panelProps.status) as Array<[string, { 外观描述: string; 当前状态: string }]>,
    );
    return () =>
      h('details', { class: 'appearance-panel private-status-panel', open: entries.value.length > 0 }, [
        h('summary', { class: 'appearance-summary private-status-summary' }, [
          h('span', { class: 'summary-title' }, [h(Eye, { size: 14 }), h('span', panelProps.title)]),
          h(
            'span',
            { class: 'summary-status' },
            entries.value.length ? `${entries.value.length} 个动态部位` : '初始为空',
          ),
        ]),
        h('div', { class: 'private-status-body' }, [
          h('div', { class: 'private-status-actions' }, [
            h(
              'button',
              {
                class: ['private-status-btn', { 'is-busy': panelProps.isBusy }],
                type: 'button',
                disabled: panelProps.disabled || panelProps.isAnyAiBusy,
                title: panelProps.disabledMessage || '只通过 AI 创建动态部位；结果需预览确认',
                onClick: () => emit('generate'),
              },
              [h(Sparkles, { size: 13 }), h('span', panelProps.isBusy ? '生成中…' : 'AI 生成私密状态')],
            ),
            entries.value.length
              ? h(
                  'button',
                  {
                    class: 'private-status-clear',
                    type: 'button',
                    disabled: panelProps.isAnyAiBusy,
                    onClick: () => emit('clear'),
                  },
                  '清空',
                )
              : null,
          ]),
          panelProps.disabledMessage
            ? h('p', { class: 'private-status-disabled-hint' }, panelProps.disabledMessage)
            : h(
                'p',
                { class: 'private-status-hint' },
                '初始为空。动态部位只能由专用 AI 生成；采用后可编辑文字，但不能手工新增部位。',
              ),
          entries.value.length
            ? h(
                'div',
                { class: 'private-status-list' },
                entries.value.map(([part, detail]) =>
                  h('div', { key: part, class: 'private-status-entry' }, [
                    h('div', { class: 'private-status-part' }, part),
                    h('label', { class: 'form-item' }, [
                      h('span', { class: 'form-label' }, '外观描述'),
                      h('textarea', {
                        value: detail.外观描述,
                        class: 'dossier-textarea private-status-textarea',
                        rows: 2,
                        onInput: (event: Event) => (detail.外观描述 = (event.target as HTMLTextAreaElement).value),
                      }),
                    ]),
                    h('label', { class: 'form-item' }, [
                      h('span', { class: 'form-label' }, '当前状态'),
                      h('textarea', {
                        value: detail.当前状态,
                        class: 'dossier-textarea private-status-textarea',
                        rows: 2,
                        onInput: (event: Event) => (detail.当前状态 = (event.target as HTMLTextAreaElement).value),
                      }),
                    ]),
                  ]),
                ),
              )
            : null,
        ]),
      ]);
  },
});
</script>

<style scoped>
.layer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.layer-banner {
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.banner-badge {
  display: inline-block;
  margin-bottom: 4px;
  color: var(--brass);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.banner-title {
  margin: 0 0 4px;
  color: var(--ink-heading);
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
}

.banner-desc {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.character-dossier-card {
  overflow: hidden;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.2s ease;
}

.character-dossier-card:hover {
  border-color: var(--border-subtle);
}

.protagonist-card {
  border-top: 3px solid var(--cinnabar);
}

.npc-card {
  border-top: 3px solid var(--brass);
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding: 14px 18px 12px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.head-left,
.head-actions {
  display: flex;
  align-items: center;
  min-width: 0;
}

.head-left {
  gap: 10px;
}

.head-actions {
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.head-seal {
  flex: 0 0 auto;
  padding: 2px 8px;
  background: var(--cinnabar);
  border-radius: var(--radius-pill);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
}

.npc-seal {
  background: var(--brass);
}

.head-title-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.head-name {
  overflow: hidden;
  margin: 0;
  color: var(--ink-heading);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.head-role-tag {
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-assist-btn,
.private-status-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  color: var(--cinnabar);
  font-size: 12px;
  font-weight: 500;
  transition: all 0.18s ease;
}

.ai-assist-btn:hover:not(:disabled),
.private-status-btn:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
}

.ai-assist-btn:disabled,
.private-status-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.del-role-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
}

.del-role-btn:hover {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.disabled-notice {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 14px 18px;
  background: var(--paper-base);
  color: var(--ink-muted);
  font-size: 12.5px;
  line-height: 1.45;
}

.card-form-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 16px 18px;
}

.field-row-3,
.field-row-2,
.appearance-grid {
  display: grid;
  gap: 10px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.field-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.field-row-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.appearance-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-hairline);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.form-label {
  color: var(--ink-muted);
  font-size: 11.5px;
  font-weight: 600;
}

.dossier-input,
.dossier-textarea {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  color: var(--ink-body);
  font-size: 13px;
  line-height: 1.45;
}

.dossier-textarea {
  resize: vertical;
}

.dossier-input:focus,
.dossier-textarea:focus {
  outline: none;
  background: var(--paper-elevated);
  border-color: var(--brass);
  box-shadow: 0 0 0 2px var(--brass-soft);
}

.dossier-input::placeholder,
.dossier-textarea::placeholder {
  color: var(--ink-faint);
  font-size: 12px;
}

.dossier-select {
  min-height: 32px;
}

.appearance-panel {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  margin-top: 4px;
  padding: 8px 12px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}

.appearance-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--ink-muted);
  font-size: 12px;
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-weight: 500;
}

.summary-title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.summary-status {
  flex: 0 0 auto;
  color: var(--brass);
  font-size: 11px;
}

.npc-section-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  margin-top: 8px;
}

.npc-header-copy {
  min-width: 0;
}

.npc-section-title {
  margin: 0 0 2px;
  color: var(--ink-heading);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
}

.npc-section-desc,
.empty-desc {
  margin: 0;
  color: var(--ink-muted);
  font-size: 12px;
  line-height: 1.45;
}

.add-role-btn {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 5px;
  padding: 6px 12px;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-md);
  color: var(--brass);
  font-size: 12.5px;
  font-weight: 600;
}

.add-role-btn:hover {
  background: var(--brass-soft);
  color: var(--ink-heading);
}

.empty-npc-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  background: var(--paper-elevated);
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-lg);
  color: var(--ink-muted);
}

.empty-icon {
  flex: 0 0 auto;
  color: var(--brass);
}

.empty-title {
  display: block;
  color: var(--ink-heading);
  font-size: 13.5px;
}

.empty-desc {
  margin-top: 2px;
}

.npc-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.switch-toggle {
  position: relative;
  display: inline-block;
  flex: 0 0 auto;
  width: 38px;
  height: 20px;
  cursor: pointer;
}

.switch-toggle input {
  width: 0;
  height: 0;
  opacity: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  background-color: var(--border-subtle);
  border-radius: var(--radius-pill);
  transition: background-color 0.2s ease;
}

.switch-slider::before {
  position: absolute;
  bottom: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgb(0 0 0 / 25%);
  content: '';
  transition: transform 0.2s ease;
}

.switch-toggle input:checked + .switch-slider {
  background-color: var(--cinnabar);
}

.switch-toggle input:checked + .switch-slider::before {
  transform: translateX(18px);
}

.favorability-label-row,
.range-scale,
.private-status-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.favorability-value {
  min-width: 30px;
  color: var(--brass);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  text-align: right;
}

.favorability-range {
  display: block;
  width: 100%;
  min-width: 0;
  accent-color: var(--cinnabar);
}

.range-scale {
  margin-top: 1px;
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: 9px;
}

.private-status-body {
  min-width: 0;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-hairline);
}

.private-status-actions {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.private-status-clear {
  padding: 4px 9px;
  background: transparent;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  color: var(--ink-muted);
  font-size: 11.5px;
}

.private-status-clear:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.private-status-hint,
.private-status-disabled-hint {
  margin: 7px 0 0;
  color: var(--ink-muted);
  font-size: 11.5px;
  line-height: 1.45;
}

.private-status-disabled-hint {
  color: var(--cinnabar);
}

.private-status-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 10px;
}

.private-status-entry {
  display: grid;
  grid-template-columns: minmax(100px, 0.7fr) repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
  min-width: 0;
  padding: 9px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}

.private-status-part {
  overflow-wrap: anywhere;
  padding-top: 22px;
  color: var(--ink-heading);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}

.private-status-textarea {
  min-height: 54px;
  font-size: 12px;
}

@media (max-width: 760px) {
  .field-row-3,
  .field-row-2,
  .appearance-grid {
    grid-template-columns: 1fr;
  }

  .private-status-entry {
    grid-template-columns: 1fr;
  }

  .private-status-part {
    padding-top: 0;
  }
}

@media (max-width: 640px) {
  .card-head,
  .npc-section-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .head-actions,
  .add-role-btn {
    width: 100%;
    justify-content: flex-start;
  }

  .head-actions .switch-toggle {
    margin-left: auto;
  }

  .head-title-wrap {
    flex-wrap: wrap;
  }
}

/* ClothingField / PrivateStatusPanel are local render components; keep their controls inside the same visual system. */
:deep(.form-item) {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

:deep(.form-label) {
  color: var(--ink-muted);
  font-size: 11.5px;
  font-weight: 600;
}

:deep(.dossier-input),
:deep(.dossier-textarea) {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 7px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  color: var(--ink-body);
  font-size: 13px;
  line-height: 1.45;
}

:deep(.dossier-textarea) {
  resize: vertical;
}

:deep(.dossier-input:focus),
:deep(.dossier-textarea:focus) {
  outline: none;
  background: var(--paper-elevated);
  border-color: var(--brass);
  box-shadow: 0 0 0 2px var(--brass-soft);
}

:deep(.private-status-body) {
  min-width: 0;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-hairline);
}

:deep(.private-status-actions) {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px;
}

:deep(.private-status-hint),
:deep(.private-status-disabled-hint) {
  margin: 7px 0 0;
  color: var(--ink-muted);
  font-size: 11.5px;
  line-height: 1.45;
}

:deep(.private-status-disabled-hint) {
  color: var(--cinnabar);
}

:deep(.private-status-list) {
  display: flex;
  flex-direction: column;
  gap: 9px;
  margin-top: 10px;
}

:deep(.private-status-entry) {
  display: grid;
  grid-template-columns: minmax(100px, 0.7fr) repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
  min-width: 0;
  padding: 9px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
}

:deep(.private-status-part) {
  overflow-wrap: anywhere;
  padding-top: 22px;
  color: var(--ink-heading);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
}

:deep(.private-status-textarea) {
  min-height: 54px;
  font-size: 12px;
}

@media (max-width: 760px) {
  :deep(.private-status-entry) {
    grid-template-columns: 1fr;
  }

  :deep(.private-status-part) {
    padding-top: 0;
  }
}
</style>

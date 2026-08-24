<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">03 · 角色与关系</div>
      <h2 class="banner-title">主角与重要登场人物</h2>
      <p class="banner-desc">为核心人物赋予明确的欲望、处境与声音，让场面因人物的碰撞而生动起来。</p>
    </div>

    <!-- 主角档案卡 -->
    <article class="character-dossier-card protagonist-card">
      <header class="card-head">
        <div class="head-left">
          <span class="head-seal">主角</span>
          <div class="head-title-wrap">
            <h3 class="head-name">
              {{ protagonistName || '当前酒馆玩家角色' }}
            </h3>
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
        <span
          >已关闭主角角色：玩家将留在故事外作为现实编辑器的观察者与操作者，AI 不会在正文中为你生成主角人物。</span
        >
      </div>

      <div v-else class="card-form-grid">
        <!-- 基础信息行 -->
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
          <div class="form-item flex-2">
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
              placeholder="例如：查明失踪姐姐的下落并解除店铺封锁"
            />
          </div>
          <div class="form-item">
            <label class="form-label">当前处境与主要压力</label>
            <input
              v-model="form.主角.处境与压力"
              type="text"
              class="dossier-input"
              placeholder="例如：三天内付不起租金店铺就会被强制收归市政"
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
      </div>
    </article>

    <!-- 重要角色 (NPC 序列) -->
    <div class="npc-section-header">
      <div class="npc-header-copy">
        <h3 class="npc-section-title">重要登场角色 (NPC)</h3>
        <p class="npc-section-desc">第一幕聚焦已登记角色，支持随时增删。留空时 AI 将以环境和低权重背景人物切入。</p>
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

          <div class="field-row-2">
            <div class="form-item">
              <label class="form-label">与主角的关系定位</label>
              <input
                v-model="character.关系定位"
                type="text"
                class="dossier-input"
                placeholder="例如：档案馆调查员、长期暗中光顾的熟客"
              />
            </div>
            <div class="form-item">
              <label class="form-label">当下的欲望与隐秘压力</label>
              <input
                v-model="character.欲望与压力"
                type="text"
                class="dossier-input"
                placeholder="例如：急需保住自己的独立调查权限，暗中提防上级清算"
              />
            </div>
          </div>

          <div class="field-row-2">
            <div class="form-item">
              <label class="form-label">性格特色与说话方式</label>
              <input
                v-model="character.性格与声音"
                type="text"
                class="dossier-input"
                placeholder="例如：语气平缓克制，语速慢，习惯先听完再表态"
              />
            </div>
            <div class="form-item">
              <label class="form-label">开场关联 / 正在进行的事</label>
              <input
                v-model="character.当前关联"
                type="text"
                class="dossier-input"
                placeholder="例如：雨夜走进书店，手里拿着一份被涂抹的旧档案"
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
            </div>
          </details>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { CircleAlert, Eye, Plus, Sparkles, Trash2, Users } from '@lucide/vue';

const props = defineProps<{
  form: any;
  aiBusyKey: string;
  protagonistName: string;
}>();

defineEmits<{
  (e: 'assistProtagonist'): void;
  (e: 'assistCharacter', index: number): void;
  (e: 'addCharacter'): void;
  (e: 'removeCharacter', index: number): void;
}>();

const hasProtagonistAppearance = computed(() =>
  Boolean(
    props.form.主角.外貌.身高 ||
    props.form.主角.外貌.体型 ||
    props.form.主角.外貌.面容气质 ||
    props.form.主角.外貌.身体特征,
  ),
);

function hasCharacterAppearance(c: any): boolean {
  return Boolean(c.身高 || c.体型 || c.面容气质 || c.身体特征);
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
</script>

<style scoped>
.layer-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layer-banner {
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
}

.banner-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 4px;
}

.banner-title {
  margin: 0 0 4px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-heading);
}

.banner-desc {
  margin: 0;
  font-size: 12.5px;
  color: var(--ink-muted);
  line-height: 1.45;
}

/* 角色卷宗卡片 */
.character-dossier-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.2s ease;
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
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 18px 12px;
  border-bottom: 1px solid var(--border-hairline);
  background: var(--paper-subtle);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.head-seal {
  padding: 2px 8px;
  background: var(--cinnabar);
  color: #fff;
  border-radius: var(--radius-pill);
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
}

.head-name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-heading);
}

.head-role-tag {
  font-size: 12px;
  color: var(--ink-muted);
}

.head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ai-assist-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  color: var(--cinnabar);
  transition: all 0.18s ease;
}

.ai-assist-btn:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
}

.ai-assist-btn:disabled {
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
  transition: all 0.15s ease;
}

.del-role-btn:hover {
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
  border-color: var(--cinnabar);
}

.disabled-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px;
  font-size: 12.5px;
  color: var(--ink-muted);
  background: var(--paper-base);
}

.card-form-grid {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-row-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.field-row-3 .flex-2 {
  grid-column: span 1;
}

.field-row-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.form-label {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--ink-muted);
}

.dossier-input {
  width: 100%;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 7px 10px;
  color: var(--ink-body);
  font-size: 13px;
  transition: all 0.18s ease;
}

.dossier-input:focus {
  outline: none;
  background: var(--paper-elevated);
  border-color: var(--brass);
  box-shadow: 0 0 0 2px var(--brass-soft);
}

.dossier-input::placeholder {
  color: var(--ink-faint);
  font-size: 12px;
}

/* 外貌折叠面板 */
.appearance-panel {
  margin-top: 4px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

.appearance-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--ink-muted);
}

.summary-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.summary-status {
  font-size: 11px;
  color: var(--brass);
}

.appearance-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-hairline);
}

/* NPC Section Header */
.npc-section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.npc-section-title {
  margin: 0 0 2px;
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-heading);
}

.npc-section-desc {
  margin: 0;
  font-size: 12px;
  color: var(--ink-muted);
}

.add-role-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-md);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--brass);
  flex-shrink: 0;
  transition: all 0.18s ease;
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
  color: var(--brass);
  flex-shrink: 0;
}

.empty-title {
  display: block;
  font-size: 13.5px;
  color: var(--ink-heading);
}

.empty-desc {
  margin: 2px 0 0;
  font-size: 12px;
}

.npc-cards-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Switch Toggle */
.switch-toggle {
  position: relative;
  display: inline-block;
  width: 38px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}

.switch-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  inset: 0;
  background-color: var(--border-subtle);
  border-radius: var(--radius-pill);
  transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-slider::before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: #fff;
  border-radius: 50%;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.switch-toggle input:checked + .switch-slider {
  background-color: var(--cinnabar);
}

.switch-toggle input:checked + .switch-slider::before {
  transform: translateX(18px);
}

@media (max-width: 640px) {
  .field-row-3,
  .field-row-2,
  .appearance-grid {
    grid-template-columns: 1fr;
  }
  .card-head {
    flex-direction: column;
    align-items: flex-start;
  }
  .head-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>

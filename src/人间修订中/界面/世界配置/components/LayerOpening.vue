<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">06 · 开局与生成</div>
      <h2 class="banner-title">开场设定与正文生成</h2>
      <p class="banner-desc">设定故事开始的时间、地点与登场人物，生成并确认开局内容。</p>
    </div>
    <section class="coordinate-fields">
      <h3 class="coordinate-title">开场日期 · 必填</h3>
      <div class="coordinate-grid">
        <label v-for="key in dateKeys" :key="key"
          >{{ key }}
          <input
            v-model="form.故事起始日期[key]"
            class="dossier-input"
            type="text"
            inputmode="numeric"
            :maxlength="key === '年' ? 4 : 2"
            :aria-label="`开场日期${key}`"
          />
        </label>
      </div>
      <p class="coordinate-hint">故事开始时的年份、月份与日期。</p>
    </section>
    <section class="coordinate-fields">
      <div class="location-heading">
        <h3 class="coordinate-title">起始地点 · 必填</h3>
        <button
          class="generate-preview-btn location-ai-btn"
          type="button"
          :disabled="Boolean(aiBusyKey)"
          @click="$emit('assist', 'opening.location')"
        >
          <Sparkles :size="14" />{{ aiBusyKey === 'opening.location' ? '生成中…' : 'AI 建议' }}
        </button>
      </div>
      <p class="coordinate-hint">从大区域逐步细化到具体场所，AI 建议会参考已填内容。</p>
      <div class="location-grid">
        <label v-for="(key, index) in locationKeys" :key="key">
          {{ locationHints[index] }}
          <input
            v-model="form.开局.起始地点[key]"
            class="dossier-input"
            :aria-label="key"
            :placeholder="locationExamples[index]"
          />
        </label>
      </div>
    </section>
    <section class="coordinate-fields">
      <h3 class="coordinate-title">开场时间 · 选填</h3>
      <div class="coordinate-grid time-grid">
        <label v-for="key in timeKeys" :key="key"
          >{{ key }}
          <input
            v-model="form.开局.时间[key]"
            class="dossier-input"
            type="text"
            inputmode="numeric"
            maxlength="2"
            :placeholder="key === '时' ? '0–23' : '0–59'"
            :aria-label="`开场时间${key}`"
          />
        </label>
      </div>
      <p class="coordinate-hint">可留空；填写时需同时指定时和分。</p>
    </section>
    <section class="coordinate-fields">
      <h3 class="coordinate-title">在场人物 · 选填</h3>
      <p class="coordinate-hint">选择开场时已在现场的角色（选填）。</p>
      <div class="presence-options">
        <label v-for="character in namedCharacters" :key="character.index">
          <input v-model="form.开局.在场角色" type="checkbox" :value="character.index" /> {{ character.name }}
        </label>
        <span v-if="!namedCharacters.length" class="coordinate-hint">暂无已登记的重要角色，开场将由主角或场景自然展开。</span>
      </div>
    </section>
    <QuestionField
      v-model="form.开局.初始情境"
      title="初始情境"
      hint="开场第一瞬间的环境或事件，留空则由 AI 自由发挥。"
      placeholder="例如：刚推开店门，柜台上放着一封未拆封的信件…"
      ai-key="opening.situation"
      :is-ai-busy="aiBusyKey === 'opening.situation'"
      :is-any-ai-busy="Boolean(aiBusyKey)"
      @assist="$emit('assist', $event)"
    />
    <details class="coordinate-fields">
      <summary>叙事偏好 · 选填</summary>
      <p class="coordinate-hint">控制正文的视角、文风与节奏倾向。</p>
      <div class="layer-fields">
        <QuestionField
          v-for="key in narrativeKeys"
          :key="key"
          v-model="form.叙事偏好[key]"
          :title="narrativeCopy[key].title"
          :placeholder="narrativeCopy[key].placeholder"
          :ai-key="`narrative.${key}`"
          :is-ai-busy="aiBusyKey === `narrative.${key}`"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          @assist="$emit('assist', $event)"
        />
      </div>
    </details>
    <!-- 开场预览与确认模块 -->
    <section class="signing-section">
      <header class="signing-head">
        <div class="signing-title-wrap">
          <span class="signing-kicker">开场生成</span>
          <h3 class="signing-title">开场正文预览</h3>
        </div>
        <div class="signing-head-actions">
          <button
            class="generate-preview-btn"
            type="button"
            :class="{ 'is-busy': openingGenerating }"
            :disabled="openingGenerating || starting"
            @click="$emit('generateOpening')"
          >
            <Sparkles :size="14" />
            <span>{{ openingGenerating ? '正在生成…' : openingPreview ? '重新生成' : '生成开场' }}</span>
          </button>
        </div>
      </header>

      <div v-if="openingGenerating" class="opening-loading-skeleton">
        <div class="skeleton-line full"></div>
        <div class="skeleton-line three-quarter"></div>
        <div class="skeleton-line half"></div>
        <p class="skeleton-text">正在根据前文设定生成开场正文…</p>
      </div>

      <div v-else-if="openingPreview" class="opening-preview-box">
        <div v-if="openingPreviewStale" class="stale-warning">
          <CircleAlert :size="14" />
          <span>配置内容已被修改，当前开场草稿可能已过时，建议重新生成。</span>
        </div>

        <div class="preview-text-scroll">
          <pre class="preview-text">{{ openingPreview }}</pre>
        </div>

        <!-- 修改意见输入 -->
        <div class="revision-input-row">
          <input
            v-model="localRevisionNote"
            type="text"
            class="dossier-input revision-input"
            placeholder="如有微调要求可在此补充（如：增加雨夜细节、强化对白压迫感等）…"
            @keydown.enter="$emit('generateOpeningWithNote', localRevisionNote)"
          />
          <button
            class="revision-btn"
            type="button"
            :disabled="openingGenerating || !localRevisionNote.trim()"
            @click="$emit('generateOpeningWithNote', localRevisionNote)"
          >
            按意见修改
          </button>
        </div>

        <div class="signing-actions">
          <button
            class="confirm-signing-btn"
            type="button"
            :disabled="starting || openingPreviewStale"
            @click="$emit('confirmOpening')"
          >
            <Stamp :size="16" class="stamp-icon" />
            <span>{{ starting ? '正在载入…' : '确认开局' }}</span>
          </button>
        </div>
      </div>

      <div v-else class="signing-placeholder">
        <p>点击上方<strong>「生成开场」</strong>，先预览开篇正文；满意后点击确认即可开始。</p>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { CircleAlert, Sparkles, Stamp } from '@lucide/vue';
import type { OpeningFormSnapshot } from '../opening';
import QuestionField from './QuestionField.vue';
const props = defineProps<{
  form: OpeningFormSnapshot;
  aiBusyKey: string;
  openingGenerating: boolean;
  openingPreview: string;
  openingPreviewStale: boolean;
  starting: boolean;
}>();
defineEmits<{
  (e: 'assist', key: string): void;
  (e: 'generateOpening'): void;
  (e: 'generateOpeningWithNote', note: string): void;
  (e: 'confirmOpening'): void;
}>();
const dateKeys = ['年', '月', '日'] as const;
const timeKeys = ['时', '分'] as const;
const locationKeys = ['一级区域', '二级区域', '三级地点'] as const;
const locationHints = ['国家、城市或大区域', '其中的城区、聚落或片区', '其中的建筑、房间或具体场所'];
const locationExamples = ['例如：临海市', '例如：老港区', '例如：灯塔街的咖啡馆'];
const narrativeCopy = {
  叙事视角: { title: '叙事视角', placeholder: '例如：第二人称（你），贴近当下感受与即时互动' },
  文风: { title: '文字风格', placeholder: '例如：注重现场细节与对话，少用华丽比喻' },
  节奏: { title: '叙事节奏', placeholder: '例如：节奏适中，留出充分的日常交流与环境观察空间' },
  体验倾向: { title: '核心体验', placeholder: '例如：日常探索、悬疑推进，偶尔带有轻松互动' },
};
const narrativeKeys = ['叙事视角', '文风', '节奏', '体验倾向'] as const;
const namedCharacters = computed(() =>
  props.form.重要角色.map((item, index) => ({ index, name: item.姓名.trim() })).filter(item => item.name),
);
const localRevisionNote = ref('');
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

.layer-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

/* 签发与第一幕生成板块 */
.signing-section {
  margin-top: 10px;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-md);
}

.signing-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 14px;
}

.signing-head-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 0;
}

.signing-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.08em;
}

.signing-title {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 17px;
  font-weight: 700;
  color: var(--ink-heading);
}

.generate-preview-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  color: var(--cinnabar);
  transition: all 0.18s ease;
}

.generate-preview-btn:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
}

.generate-preview-btn.is-busy {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
}

.signing-placeholder {
  padding: 24px;
  text-align: center;
  color: var(--ink-muted);
  font-size: 13px;
  background: var(--paper-base);
  border-radius: var(--radius-md);
}

.opening-loading-skeleton {
  padding: 20px;
  background: var(--paper-base);
  border-radius: var(--radius-md);
}

.skeleton-line {
  height: 12px;
  background: var(--border-subtle);
  border-radius: 4px;
  margin-bottom: 10px;
  animation: pulse 1.5s infinite ease-in-out;
}
.skeleton-line.full {
  width: 100%;
}
.skeleton-line.three-quarter {
  width: 75%;
}
.skeleton-line.half {
  width: 50%;
}
.skeleton-text {
  font-size: 12px;
  color: var(--ink-muted);
  margin-top: 14px;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.opening-preview-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stale-warning {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  background: var(--brass-soft);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--brass);
}

.preview-text-scroll {
  max-height: 320px;
  overflow-y: auto;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 16px;
}

.preview-text {
  margin: 0;
  font-family: var(--font-body);
  font-size: 13.5px;
  line-height: 1.7;
  color: var(--ink-body);
  white-space: pre-wrap;
  word-break: break-word;
}

.revision-input-row {
  display: flex;
  gap: 8px;
}

.revision-input {
  flex: 1;
}

.revision-btn {
  padding: 6px 14px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--ink-heading);
  white-space: nowrap;
  transition: all 0.15s ease;
}

.revision-btn:hover:not(:disabled) {
  background: var(--paper-elevated);
  border-color: var(--brass-border);
}

.signing-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.confirm-signing-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar-hover);
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 2px 10px var(--cinnabar-glow);
  transition: all 0.2s ease;
}

.confirm-signing-btn:hover:not(:disabled) {
  background: var(--cinnabar-hover);
  box-shadow: 0 4px 16px var(--cinnabar-glow);
  transform: translateY(-1px);
}

.confirm-signing-btn:disabled {
  opacity: 0.5;
  transform: none;
}

.stamp-icon {
  color: #fff;
}

@media (max-width: 768px) {
  .signing-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .signing-head-actions {
    align-items: flex-start;
  }
}

.coordinate-fields {
  min-width: 0;
  margin: 0;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px;
  background: var(--paper-subtle);
}
.coordinate-title,
.coordinate-fields summary {
  font-weight: 600;
  color: var(--ink-heading);
  font-size: 14px;
}
.coordinate-fields summary {
  cursor: pointer;
}
.coordinate-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.coordinate-grid label {
  color: var(--ink-body);
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}
.coordinate-grid input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
.time-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.coordinate-hint {
  font-size: 13px;
  color: var(--ink-muted);
  line-height: 1.6;
}
.location-grid,
.layer-fields {
  display: grid;
  gap: 14px;
  min-width: 0;
}
.presence-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
}
.banner-badge {
  font-size: 12px;
}

.dossier-input {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--ink-body);
  font-size: 13.5px;
  line-height: 1.55;
}
.dossier-input:focus {
  outline: none;
  border-color: var(--brass);
  box-shadow: 0 0 0 2px var(--brass-soft);
}
.coordinate-title {
  margin: 0 0 12px;
  line-height: 1.6;
}
.location-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  justify-content: space-between;
}
.location-heading .coordinate-title {
  margin: 0;
}
.location-grid label {
  color: var(--ink-body);
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  min-width: 0;
}
</style>

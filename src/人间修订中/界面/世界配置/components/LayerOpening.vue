<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">06 · 开局与生成</div>
      <h2 class="banner-title">选择进入世界的瞬间</h2>
      <p class="banner-desc">只需填写日期与三级地点。其他内容可留空，平静的日常也可以成为开场。</p>
    </div>
    <fieldset class="coordinate-fields">
      <legend>开场日期 · 必填</legend>
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
      <p class="coordinate-hint">使用故事日期，不会自动填入现实日期。</p>
    </fieldset>
    <fieldset class="coordinate-fields">
      <legend>起始地点 · 三级必填</legend>
      <div class="location-grid">
        <QuestionField
          v-for="(key, index) in locationKeys"
          :key="key"
          :title="key"
          type="input"
          :hint="locationHints[index]"
          :model-value="form.开局.起始地点[key]"
          :ai-key="`opening.location.${index + 1}`"
          :is-ai-busy="aiBusyKey === `opening.location.${index + 1}`"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          @update:model-value="form.开局.起始地点[key] = $event"
          @assist="$emit('assist', $event)"
        />
      </div>
    </fieldset>
    <fieldset class="coordinate-fields">
      <legend>开场时间 · 选填</legend>
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
      <p class="coordinate-hint">可全部留空；指定时间时，同时填写时和分。</p>
    </fieldset>
    <fieldset class="coordinate-fields">
      <legend>在场人物 · 选填</legend>
      <p class="coordinate-hint">从第四层已命名角色中选择，不重复填写人物档案。主角是否参与沿用第四层设置。</p>
      <div class="presence-options">
        <label v-for="character in namedCharacters" :key="character.index">
          <input v-model="form.开局.在场角色" type="checkbox" :value="character.index" /> {{ character.name }}
        </label>
        <span v-if="!namedCharacters.length" class="coordinate-hint">尚无已命名的重要角色，可直接跳过。</span>
      </div>
    </fieldset>
    <QuestionField
      v-model="form.开局.初始情境"
      title="初始情境"
      hint="开场这一刻，人物正在做什么？只描述眼前情境，不必安排危机或任务。"
      placeholder="选填"
      ai-key="opening.situation"
      :is-ai-busy="aiBusyKey === 'opening.situation'"
      :is-any-ai-busy="Boolean(aiBusyKey)"
      @assist="$emit('assist', $event)"
    />
    <details class="coordinate-fields">
      <summary>叙事偏好 · 选填</summary>
      <p class="coordinate-hint">只控制正文如何呈现，不作为世界事实。</p>
      <div class="layer-fields">
        <QuestionField
          v-for="key in narrativeKeys"
          :key="key"
          v-model="form.叙事偏好[key]"
          :title="key"
          placeholder="选填"
          :ai-key="`narrative.${key}`"
          :is-ai-busy="aiBusyKey === `narrative.${key}`"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          @assist="$emit('assist', $event)"
        />
      </div>
    </details>
    <!-- 开场预览与签发模块 -->
    <section class="signing-section">
      <header class="signing-head">
        <div class="signing-title-wrap">
          <span class="signing-kicker">FINAL REVISION & SIGNING</span>
          <h3 class="signing-title">签发卷宗 · 第一幕生成</h3>
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
            <span>{{ openingGenerating ? '正在生成第一幕…' : openingPreview ? '重新生成' : '生成唯一开场预览' }}</span>
          </button>
        </div>
      </header>

      <div v-if="openingGenerating" class="opening-loading-skeleton">
        <div class="skeleton-line full"></div>
        <div class="skeleton-line three-quarter"></div>
        <div class="skeleton-line half"></div>
        <p class="skeleton-text">正在依据 6 层配置设定生成唯一正式开局正文，请稍候…</p>
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
            <span>{{ starting ? '正在签发写入…' : '签发卷宗 · 开启第一幕' }}</span>
          </button>
        </div>
      </div>

      <div v-else class="signing-placeholder">
        <p>
          点击上方<strong>「生成唯一开场预览」</strong>，AI 将根据你已填写的 6 层世界观、主角和重要角色生成第一幕正文。
        </p>
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
.coordinate-fields legend,
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
</style>

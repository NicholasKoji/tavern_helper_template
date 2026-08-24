<template>
  <div class="layer-container">
    <div class="layer-banner">
      <div class="banner-badge">05 · 现实编辑器与签发</div>
      <h2 class="banner-title">设定现实编辑器的运行法则与边界</h2>
      <p class="banner-desc">最后单独决定它的表现形式、可见权限、执行约束与代价，并签发开启第一幕。</p>
    </div>

    <div class="layer-fields">
      <!-- 表现形式与可见知晓 -->
      <div class="grid-2-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">表现形式</h3>
            <span class="choice-tag">{{ form.现实编辑器.表现形式 }}</span>
          </div>
          <p class="choice-hint">现实编辑器在故事中以何种形态被感知或操作？</p>
          <div class="pill-group">
            <button
              v-for="opt in editorFormOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.表现形式 === opt }"
              @click="form.现实编辑器.表现形式 = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <QuestionField
          title="可见、使用与知晓边界"
          hint="谁能看见、使用现实编辑器？他人是否会察觉异常？"
          :model-value="form.现实编辑器.可见与知晓"
          placeholder="例如：只有主角可见并能操作；NPC 无法感知界面的存在，但能感受规则生效后的结果…"
          ai-key="editor.visibility"
          :is-ai-busy="aiBusyKey === 'editor.visibility'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.可见与知晓 = $event"
          @assist="$emit('assist', $event)"
        />
      </div>

      <!-- 可修改范围与常识同步 -->
      <div class="grid-3-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">可修改范围</h3>
            <span class="choice-tag">{{ form.现实编辑器.可修改范围.join('、') || '无' }}</span>
          </div>
          <p class="choice-hint">允许编辑器作用的规则层级（可多选）：</p>
          <div class="checkbox-group">
            <label
              v-for="scope in editorScopes"
              :key="scope.value"
              class="custom-check-item"
              :class="{ 'is-checked': form.现实编辑器.可修改范围.includes(scope.value) }"
            >
              <input
                type="checkbox"
                :checked="form.现实编辑器.可修改范围.includes(scope.value)"
                @change="toggleScope(scope.value)"
              />
              <span class="check-text">
                <strong>{{ scope.label }}</strong>
                <small>{{ scope.description }}</small>
              </span>
            </label>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">常识同步方式</h3>
            <span class="choice-tag">{{ form.现实编辑器.常识同步 }}</span>
          </div>
          <p class="choice-hint">规则修改后，世人如何接受新常识？</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorSyncOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.常识同步 === opt }"
              @click="form.现实编辑器.常识同步 = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">记忆保留策略</h3>
            <span class="choice-tag">{{ form.现实编辑器.记忆保留 }}</span>
          </div>
          <p class="choice-hint">规则修改前后，谁保留旧记忆？</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorMemoryOptions"
              :key="opt"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.记忆保留 === opt }"
              @click="form.现实编辑器.记忆保留 = opt"
            >
              {{ opt }}
            </button>
          </div>
        </div>
      </div>

      <!-- 主角受影响与自主执行 -->
      <div class="grid-2-col">
        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">主角是否受规则约束</h3>
            <span class="choice-tag">{{ form.现实编辑器.主角受影响 }}</span>
          </div>
          <p class="choice-hint">新规则是否同样强制作用于持有者自身？</p>
          <div class="pill-group">
            <button
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.主角受影响 === '是' }"
              @click="form.现实编辑器.主角受影响 = '是'"
            >
              是（主角也受新常识/规则约束）
            </button>
            <button
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.主角受影响 === '否' }"
              @click="form.现实编辑器.主角受影响 = '否'"
            >
              否（主角保持绝对豁免与清醒）
            </button>
          </div>
        </div>

        <div class="choice-card">
          <div class="choice-head">
            <h3 class="choice-title">自主执行倾向</h3>
            <span class="choice-tag">{{ autonomyLabel }}</span>
          </div>
          <p class="choice-hint">编辑器是否会脱离玩家意志自主变动规则？</p>
          <div class="pill-group vertical-pills">
            <button
              v-for="opt in editorAutonomyOptions"
              :key="opt.value"
              type="button"
              class="pill-btn"
              :class="{ active: form.现实编辑器.自主执行 === opt.value }"
              @click="form.现实编辑器.自主执行 = opt.value"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="grid-2-col">
        <QuestionField
          title="限制、代价与异常反馈"
          hint="修改现实需要付出什么代价？是否会引发空间坍塌或能量过载？"
          :model-value="form.现实编辑器.限制与代价"
          placeholder="例如：每次修改必须在官方公告栏留下可审计的运维日志；单日修改超过三次会导致局部感知错乱…"
          ai-key="editor.limit"
          :is-ai-busy="aiBusyKey === 'editor.limit'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.限制与代价 = $event"
          @assist="$emit('assist', $event)"
        />

        <QuestionField
          title="自然语言修改约定"
          hint="玩家在正文中如何向编辑器发出修改指令？"
          :model-value="form.现实编辑器.自然语言修改"
          placeholder="例如：玩家在对话中说出明确诉求后，编辑器以悬浮面板形式提供修改确认草案…"
          ai-key="editor.language"
          :is-ai-busy="aiBusyKey === 'editor.language'"
          :is-any-ai-busy="Boolean(aiBusyKey)"
          :rows="2"
          @update:model-value="form.现实编辑器.自然语言修改 = $event"
          @assist="$emit('assist', $event)"
        />
      </div>

      <!-- 开场预览与签发模块 -->
      <section class="signing-section">
        <header class="signing-head">
          <div class="signing-title-wrap">
            <span class="signing-kicker">FINAL REVISION & SIGNING</span>
            <h3 class="signing-title">签发卷宗 · 第一幕生成</h3>
          </div>
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
        </header>

        <div v-if="openingGenerating" class="opening-loading-skeleton">
          <div class="skeleton-line full"></div>
          <div class="skeleton-line three-quarter"></div>
          <div class="skeleton-line half"></div>
          <p class="skeleton-text">正在依据 5 层访谈设定生成唯一正式开局正文，请稍候…</p>
        </div>

        <div v-else-if="openingPreview" class="opening-preview-box">
          <div v-if="openingPreviewStale" class="stale-warning">
            <CircleAlert :size="14" />
            <span>前文访谈设定已被修改，当前开场草稿可能已过时，建议重新生成。</span>
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
            点击上方<strong>「生成唯一开场预览」</strong>，AI 将根据你已配置的 5
            层世界观、主角和重要角色生成第一幕正文。
          </p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { CircleAlert, Sparkles, Stamp } from '@lucide/vue';
import QuestionField from './QuestionField.vue';

const props = defineProps<{
  form: any;
  aiBusyKey: string;
  editorFormOptions: string[];
  editorScopes: Array<{ value: string; label: string; description: string }>;
  editorSyncOptions: string[];
  editorMemoryOptions: string[];
  editorAutonomyOptions: Array<{ value: string; label: string }>;
  openingGenerating: boolean;
  openingPreview: string;
  openingPreviewStale: boolean;
  starting: boolean;
}>();

const emit = defineEmits<{
  (e: 'assist', key: string): void;
  (e: 'generateOpening'): void;
  (e: 'generateOpeningWithNote', note: string): void;
  (e: 'confirmOpening'): void;
}>();

const localRevisionNote = ref('');

const autonomyLabel = computed(() => {
  const match = props.editorAutonomyOptions.find(opt => opt.value === props.form.现实编辑器.自主执行);
  return match ? match.label : props.form.现实编辑器.自主执行;
});

function toggleScope(scopeVal: string) {
  const current = props.form.现实编辑器.可修改范围 as string[];
  if (current.includes(scopeVal)) {
    props.form.现实编辑器.可修改范围 = current.filter(item => item !== scopeVal);
  } else {
    props.form.现实编辑器.可修改范围 = [...current, scopeVal];
  }
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

.layer-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.grid-2-col {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

.grid-3-col {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.choice-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
}

.choice-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.choice-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-heading);
}

.choice-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  background: var(--brass-soft);
  color: var(--brass);
  border-radius: 4px;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.choice-hint {
  margin: 0 0 10px;
  font-size: 11.5px;
  color: var(--ink-muted);
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.vertical-pills {
  flex-direction: column;
}

.pill-btn {
  padding: 5px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  font-size: 12px;
  color: var(--ink-body);
  transition: all 0.15s ease;
  text-align: left;
}

.pill-btn:hover {
  border-color: var(--brass-border);
  background: var(--paper-subtle);
}

.pill-btn.active {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 1px 4px var(--cinnabar-soft);
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.custom-check-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.15s ease;
}

.custom-check-item:hover {
  background: var(--paper-subtle);
  border-color: var(--border-subtle);
}

.custom-check-item.is-checked {
  border-color: var(--brass-border);
  background: var(--brass-soft);
}

.custom-check-item input {
  margin-top: 3px;
  accent-color: var(--cinnabar);
}

.check-text strong {
  display: block;
  font-size: 12.5px;
  color: var(--ink-heading);
}

.check-text small {
  display: block;
  font-size: 11px;
  color: var(--ink-muted);
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
  .grid-2-col,
  .grid-3-col {
    grid-template-columns: 1fr;
  }
  .signing-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>

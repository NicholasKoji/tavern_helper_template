<template>
  <section class="plan-library" aria-labelledby="opening-plan-library-title">
    <div class="plan-library-head">
      <div class="plan-heading">
        <span class="plan-kicker">OPENING CONFIGURATION ARCHIVE</span>
        <h2 id="opening-plan-library-title" class="plan-title">已有方案 / 复用已有方案</h2>
        <p class="plan-description">把五层创作表单存成可重复使用的本地方案，不会写入当前聊天的 MVU 状态。</p>
      </div>

      <div class="plan-import-wrap">
        <input
          ref="fileInput"
          class="plan-file-input"
          type="file"
          accept="application/json,.json"
          aria-label="选择要导入的方案 JSON 文件"
          @change="onFileChange"
        />
        <button class="plan-import-btn" type="button" title="导入方案 JSON 文件" @click="openFilePicker">
          <Upload :size="14" />
          <span>导入</span>
        </button>
      </div>
    </div>

    <div v-if="plans.length" class="plan-list">
      <article
        v-for="(plan, index) in plans"
        :key="plan.id"
        class="plan-row"
        :class="{ 'is-current': plan.id === currentPlanId }"
      >
        <div class="plan-index" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</div>
        <div class="plan-copy">
          <div class="plan-name-line">
            <h3 class="plan-name">{{ plan.名称 }}</h3>
            <span v-if="plan.id === currentPlanId" class="current-badge">当前方案</span>
            <time class="plan-time" :datetime="plan.updatedAt">更新于 {{ formatUpdatedAt(plan.updatedAt) }}</time>
          </div>
          <p class="plan-summary">{{ plan.摘要 || '暂无摘要，将按当前五层内容套用。' }}</p>
        </div>

        <div class="plan-actions">
          <button class="plan-action primary" type="button" @click="emit('apply', plan)">套用</button>
          <button class="plan-action forward" type="button" @click="emit('apply-and-forward', plan)">
            <ArrowRight :size="13" />
            <span>套用并前往第五层</span>
          </button>
          <button
            class="plan-icon-action"
            type="button"
            title="导出 JSON"
            :aria-label="`导出方案 ${plan.名称}`"
            @click="emit('export', plan)"
          >
            <Download :size="14" />
          </button>
          <button
            class="plan-icon-action danger"
            type="button"
            title="删除方案"
            :aria-label="`删除方案 ${plan.名称}`"
            @click="emit('delete', plan)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </article>
    </div>

    <div v-else class="plan-empty">
      <Bookmark :size="16" />
      <span>还没有本地方案。完成第五层后，可在签发区保存第一份。</span>
    </div>

    <p class="plan-footnote">单方案导出保留 schemaVersion、表单快照与时间信息，后续字段迁移集中处理。</p>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ArrowRight, Bookmark, Download, Trash2, Upload } from '@lucide/vue';
import type { OpeningPlan } from '../opening-plans';

defineProps<{
  plans: readonly OpeningPlan[];
  currentPlanId: string | null;
}>();

const emit = defineEmits<{
  (event: 'apply', plan: OpeningPlan): void;
  (event: 'apply-and-forward', plan: OpeningPlan): void;
  (event: 'export', plan: OpeningPlan): void;
  (event: 'delete', plan: OpeningPlan): void;
  (event: 'import', file: File): void;
}>();

const fileInput = ref<HTMLInputElement | null>(null);

function openFilePicker() {
  fileInput.value?.click();
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (file) emit('import', file);
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
</script>

<style scoped>
.plan-library {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
  padding: 14px 16px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.plan-library-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.plan-heading {
  min-width: 0;
}

.plan-kicker {
  display: block;
  margin-bottom: 3px;
  color: var(--brass);
  font-family: var(--font-mono);
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.plan-title {
  margin: 0;
  color: var(--ink-heading);
  font-family: var(--font-display);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
}

.plan-description,
.plan-footnote {
  margin: 3px 0 0;
  color: var(--ink-muted);
  font-size: 11.5px;
  line-height: 1.45;
}

.plan-import-wrap {
  flex-shrink: 0;
}

.plan-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  clip-path: inset(50%);
}

.plan-import-btn,
.plan-action,
.plan-icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border-radius: var(--radius-pill);
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease,
    transform 0.18s ease;
}

.plan-import-btn {
  padding: 7px 11px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--ink-body);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
}

.plan-import-btn:hover {
  border-color: var(--brass-border);
  color: var(--brass);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.plan-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 9px 10px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.plan-row.is-current {
  background: var(--brass-soft);
  border-color: var(--brass-border);
}

.plan-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  color: var(--brass);
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
}

.plan-copy {
  min-width: 0;
}

.plan-name-line {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.plan-name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ink-heading);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-badge {
  flex-shrink: 0;
  padding: 1px 5px;
  border: 1px solid var(--cinnabar-soft);
  border-radius: var(--radius-pill);
  color: var(--cinnabar);
  font-size: 9.5px;
  font-weight: 600;
}

.plan-time {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--ink-muted);
  font-size: 10px;
  white-space: nowrap;
}

.plan-summary {
  margin: 2px 0 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 5px;
  flex-shrink: 0;
}

.plan-action {
  padding: 6px 9px;
  border: 1px solid var(--border-subtle);
  background: var(--paper-elevated);
  color: var(--ink-body);
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.plan-action.primary:hover {
  border-color: var(--cinnabar);
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
}

.plan-action.forward {
  border-color: var(--brass-border);
  color: var(--brass);
}

.plan-action.forward:hover {
  background: var(--brass-soft);
  color: var(--ink-heading);
  transform: translateY(-1px);
}

.plan-icon-action {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border-hairline);
  background: transparent;
  color: var(--ink-muted);
}

.plan-icon-action:hover {
  border-color: var(--brass-border);
  background: var(--paper-elevated);
  color: var(--brass);
}

.plan-icon-action.danger:hover {
  border-color: var(--cinnabar);
  color: var(--cinnabar);
}

.plan-empty {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 10px;
  border: 1px dashed var(--border-subtle);
  border-radius: var(--radius-md);
  color: var(--ink-muted);
  font-size: 11.5px;
}

.plan-footnote {
  margin-top: 0;
  font-size: 10.5px;
}

@media (max-width: 760px) {
  .plan-row {
    grid-template-columns: 26px minmax(0, 1fr);
  }

  .plan-actions {
    grid-column: 2;
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .plan-time {
    display: none;
  }
}

@media (max-width: 460px) {
  .plan-library {
    padding: 12px;
  }

  .plan-library-head {
    flex-direction: column;
  }

  .plan-row {
    gap: 8px;
    padding: 8px;
  }

  .plan-action.forward span {
    display: none;
  }
}
</style>

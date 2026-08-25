<template>
  <div class="modal-backdrop" role="presentation" @click.self="$emit('cancel')">
    <section class="lore-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <header class="modal-head">
        <div>
          <p class="eyebrow">NPC 长期档案 · 二次确认</p>
          <h2 :id="titleId">{{ preview.targetName }}</h2>
        </div>
        <button class="icon-close" type="button" aria-label="取消" :disabled="busy" @click="$emit('cancel')">×</button>
      </header>

      <div class="modal-body">
        <div class="meta-grid">
          <div class="meta-item">
            <span>操作</span>
            <strong>{{ preview.mode === 'update' ? '更新受管条目' : '新建受管条目' }}</strong>
          </div>
          <div class="meta-item">
            <span>Assistant 正文层数</span>
            <strong>{{ preview.assistantBodies.length }} / 3</strong>
          </div>
          <div class="meta-item">
            <span>最终文本字符数</span>
            <strong>{{ characterCount }}</strong>
          </div>
        </div>

        <div v-if="preview.conflictingEntries.length" class="conflict-banner" role="alert">
          <strong>发现同名用户条目，原条目会保留</strong>
          <p>
            {{ preview.conflictingEntries.map(entry => entry.name).join('、') }} 与目标 NPC
            同名，但不是本功能受管条目；请取消或重新整理后处理冲突。
          </p>
        </div>

        <details v-if="preview.mode === 'update' && preview.existingEntryContent" class="baseline-details">
          <summary>查看现有受管条目基线</summary>
          <pre>{{ preview.existingEntryContent }}</pre>
        </details>

        <div class="draft-block">
          <div class="draft-label-row">
            <label :for="textareaId">生成后的最终文本</label>
            <span>{{ characterCount }} 字符</span>
          </div>
          <textarea
            :id="textareaId"
            v-model="editedContent"
            class="draft-editor"
            :disabled="busy"
            spellcheck="false"
          ></textarea>
          <p class="draft-hint">确认写入时将使用此文本的字面内容；顶层名称需保持为“{{ preview.targetName }}”。</p>
        </div>

        <p v-if="error" class="error-message" role="alert">{{ error }}</p>
      </div>

      <footer class="modal-foot">
        <button class="secondary-button" type="button" :disabled="busy" @click="$emit('regenerate')">重新整理</button>
        <button class="secondary-button" type="button" :disabled="busy" @click="$emit('cancel')">取消</button>
        <button
          class="primary-button"
          type="button"
          :disabled="busy || Boolean(preview.conflictingEntries.length) || !editedContent.trim()"
          @click="$emit('confirm', editedContent)"
        >
          {{ busy ? '处理中…' : '确认写入' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { NpcLorePreview } from '../npc-lore';

const props = defineProps<{
  preview: NpcLorePreview;
  busy: boolean;
  error: string;
}>();

defineEmits<{
  (e: 'cancel'): void;
  (e: 'regenerate'): void;
  (e: 'confirm', content: string): void;
}>();

const titleId = `npc-lore-preview-title-${Math.random().toString(36).slice(2)}`;
const textareaId = `npc-lore-preview-text-${Math.random().toString(36).slice(2)}`;
const editedContent = ref(props.preview.generatedText);
const characterCount = computed(() => editedContent.value.length);

watch(
  () => props.preview.generatedText,
  value => {
    editedContent.value = value;
  },
);
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  z-index: 40;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 16px;
  background: rgb(20 17 13 / 48%);
}

.lore-modal {
  display: flex;
  flex-direction: column;
  width: min(760px, 100%);
  max-height: min(840px, calc(100vh - 32px));
  overflow: hidden;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.modal-head,
.modal-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.modal-foot {
  justify-content: flex-end;
  border-top: 1px solid var(--border-hairline);
  border-bottom: 0;
}

.eyebrow {
  margin: 0 0 3px;
  color: var(--brass);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
}

.modal-head h2 {
  margin: 0;
  color: var(--ink-heading);
  font-family: var(--font-display);
  font-size: 18px;
}

.icon-close {
  width: 30px;
  height: 30px;
  border: 1px solid var(--border-hairline);
  border-radius: 50%;
  background: transparent;
  color: var(--ink-muted);
  font-size: 20px;
  line-height: 1;
}

.icon-close:not(:disabled) {
  cursor: pointer;
}

.modal-body {
  overflow: auto;
  padding: 14px 16px;
}

.meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
}

.meta-item span,
.draft-label-row,
.draft-hint {
  color: var(--ink-muted);
  font-size: 11px;
}

.meta-item strong {
  color: var(--ink-heading);
  font-family: var(--font-mono);
  font-size: 12px;
}

.conflict-banner {
  margin-bottom: 12px;
  padding: 9px 10px;
  border: 1px solid rgb(170 77 48 / 55%);
  border-radius: var(--radius-sm);
  background: rgb(170 77 48 / 8%);
  color: var(--cinnabar);
}

.conflict-banner strong {
  font-size: 12px;
}

.conflict-banner p {
  margin: 4px 0 0;
  font-size: 11px;
  line-height: 1.5;
}

.baseline-details {
  margin-bottom: 12px;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  background: var(--paper-base);
}

.baseline-details summary {
  padding: 8px 10px;
  color: var(--ink-heading);
  cursor: pointer;
  font-size: 12px;
}

.baseline-details pre {
  max-height: 180px;
  overflow: auto;
  margin: 0;
  padding: 0 10px 10px;
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: 10px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.draft-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.draft-label-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.draft-label-row label {
  color: var(--ink-heading);
  font-size: 12px;
  font-weight: 600;
}

.draft-editor {
  min-height: 320px;
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  padding: 10px;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  background: var(--paper-base);
  color: var(--ink-body);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.55;
}

.draft-editor:focus {
  outline: 2px solid var(--brass-border);
  outline-offset: 1px;
}

.draft-hint {
  margin: 0;
  line-height: 1.5;
}

.error-message {
  margin: 10px 0 0;
  color: var(--cinnabar);
  font-size: 12px;
}

.secondary-button,
.primary-button {
  min-height: 30px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-family: var(--font-mono);
  font-size: 11px;
  cursor: pointer;
}

.secondary-button {
  border: 1px solid var(--border-hairline);
  background: var(--paper-base);
  color: var(--ink-heading);
}

.primary-button {
  border: 1px solid var(--brass);
  background: var(--brass);
  color: var(--paper-base);
}

.secondary-button:disabled,
.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 560px) {
  .modal-backdrop {
    padding: 8px;
  }

  .lore-modal {
    max-height: calc(100vh - 16px);
  }

  .meta-grid {
    grid-template-columns: 1fr;
  }

  .modal-foot {
    flex-wrap: wrap;
  }

  .modal-foot button {
    flex: 1 1 auto;
  }
}
</style>

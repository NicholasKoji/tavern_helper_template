<template>
  <div class="question-card" :class="{ 'is-focused': isFocused, 'is-filled': Boolean(modelValue) }">
    <div class="card-header">
      <div class="card-title-group">
        <h3 class="card-title">{{ title }}</h3>
        <p v-if="hint" class="card-hint">{{ hint }}</p>
      </div>

      <button
        v-if="aiKey"
        class="ai-assist-btn"
        :class="{ 'is-busy': isAiBusy }"
        type="button"
        :aria-busy="isAiBusy"
        :disabled="isAnyAiBusy"
        @click="$emit('assist', aiKey)"
      >
        <Sparkles :size="13" class="sparkle-icon" />
        <span>{{ isAiBusy ? '整理中…' : 'AI 建议' }}</span>
      </button>
    </div>

    <div class="card-body">
      <slot>
        <textarea
          v-if="type === 'textarea'"
          :value="modelValue"
          :placeholder="placeholder"
          :rows="rows || 3"
          class="dossier-textarea"
          @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        ></textarea>
        <input
          v-else
          type="text"
          :value="modelValue"
          :placeholder="placeholder"
          class="dossier-input"
          @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
          @focus="isFocused = true"
          @blur="isFocused = false"
        />
      </slot>
    </div>

    <div v-if="presets && presets.length" class="card-presets">
      <span class="preset-label">快捷参考：</span>
      <div class="preset-chips">
        <button
          v-for="preset in presets"
          :key="preset"
          type="button"
          class="preset-chip"
          @click="$emit('update:modelValue', preset)"
        >
          {{ preset }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Sparkles } from '@lucide/vue';

withDefaults(
  defineProps<{
    title: string;
    hint?: string;
    modelValue?: string;
    placeholder?: string;
    aiKey?: string;
    isAiBusy?: boolean;
    isAnyAiBusy?: boolean;
    type?: 'input' | 'textarea';
    rows?: number;
    presets?: string[];
  }>(),
  {
    hint: '',
    modelValue: '',
    placeholder: '',
    aiKey: '',
    isAiBusy: false,
    isAnyAiBusy: false,
    type: 'textarea',
    rows: 3,
    presets: () => [],
  },
);

defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'assist', key: string): void;
}>();

const isFocused = ref(false);
</script>

<style scoped>
.question-card {
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px 18px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.question-card:hover {
  border-color: var(--border-subtle);
}

.question-card.is-focused {
  border-color: var(--brass-border);
  box-shadow: var(--shadow-md);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 10px;
}

.card-title-group {
  flex: 1;
}

.card-title {
  margin: 0 0 2px;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
  line-height: 1.35;
}

.card-hint {
  margin: 0;
  font-size: 12px;
  color: var(--ink-muted);
  line-height: 1.45;
}

.ai-assist-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 500;
  color: var(--cinnabar);
  flex-shrink: 0;
  transition: all 0.18s ease;
}

.ai-assist-btn:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
  box-shadow: 0 0 0 2px var(--cinnabar-soft);
}

.ai-assist-btn.is-busy {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
  opacity: 0.8;
}

.ai-assist-btn:disabled {
  opacity: 0.5;
}

.sparkle-icon {
  color: var(--cinnabar);
}

.card-body {
  position: relative;
  width: 100%;
  min-width: 0;
}

.dossier-textarea,
.dossier-input {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  color: var(--ink-body);
  font-size: 13.5px;
  line-height: 1.55;
  transition: all 0.18s ease;
  word-break: break-word;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  resize: vertical;
}

.dossier-textarea:focus,
.dossier-input:focus {
  outline: none;
  background: var(--paper-elevated);
  border-color: var(--brass);
  box-shadow: 0 0 0 2px var(--brass-soft);
}

.dossier-textarea::placeholder,
.dossier-input::placeholder {
  color: var(--ink-faint);
  font-size: 12.5px;
}

.card-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  padding-top: 8px;
  padding-bottom: 2px;
  border-top: 1px dashed var(--border-hairline);
  min-width: 0;
  width: 100%;
  box-sizing: border-box;
}

.preset-label {
  font-size: 11.5px;
  color: var(--ink-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.preset-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  min-width: 0;
  flex: 1;
  padding-bottom: 3px;
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
}

.preset-chips::-webkit-scrollbar {
  height: 3px;
}

.preset-chips::-webkit-scrollbar-track {
  background: transparent;
}

.preset-chips::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: var(--radius-pill);
}

.preset-chips::-webkit-scrollbar-thumb:hover {
  background: var(--brass-border);
}

.preset-chip {
  flex-shrink: 0;
  padding: 3px 9px;
  background: var(--paper-subtle);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  font-size: 11.5px;
  color: var(--ink-body);
  white-space: nowrap;
  transition: all 0.15s ease;
  cursor: pointer;
}

.preset-chip:hover {
  background: var(--brass-soft);
  border-color: var(--brass-border);
  color: var(--ink-heading);
}

@media (max-width: 640px) {
  .question-card {
    padding: 12px 14px;
  }
}
</style>

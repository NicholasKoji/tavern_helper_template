<template>
  <transition name="modal-fade">
    <div
      v-if="aiPreview"
      class="ai-modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="'ai-preview-title'"
      @click.self="$emit('close')"
    >
      <div ref="modalElement" class="ai-modal-card" tabindex="-1">
        <header class="modal-header">
          <div class="header-left">
            <span class="modal-seal">
              <Sparkles :size="12" />
              <span>AI 整理</span>
            </span>
            <h3 id="ai-preview-title" class="modal-title">{{ aiPreview.title }}</h3>
          </div>
          <button class="close-btn" type="button" aria-label="关闭预览" @click="$emit('close')">
            <X :size="16" />
          </button>
        </header>

        <div v-if="isStale" class="modal-stale-alert">
          <CircleAlert :size="14" />
          <span>相关上下文已发生变化，当前整理结果可能已过时。</span>
        </div>

        <div class="modal-body-scroll">
          <!-- 结论与摘要 -->
          <div class="summary-box">
            <h4 class="section-label">整理结论</h4>
            <p class="summary-text">{{ aiPreview.summary }}</p>
          </div>

          <!-- 理由阐述 -->
          <div v-if="aiPreview.rationale" class="rationale-box">
            <h4 class="section-label">设计考量与影响</h4>
            <p class="rationale-text">{{ aiPreview.rationale }}</p>
          </div>

          <!-- 可执行约束 -->
          <div v-if="aiPreview.constraints && aiPreview.constraints.length" class="constraints-box">
            <h4 class="section-label">可执行叙事约束</h4>
            <ul class="constraints-list">
              <li v-for="(item, idx) in aiPreview.constraints" :key="idx">{{ item }}</li>
            </ul>
          </div>

          <!-- 建议内容明细 -->
          <div v-if="hasValues" class="values-box">
            <h4 class="section-label">拟写入的字段内容</h4>
            <div class="values-grid">
              <div v-for="(val, key) in aiPreview.values" :key="key" class="value-item">
                <span class="value-key">{{ formatKey(key) }}</span>
                <span class="value-val">{{ val }}</span>
              </div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <button
            class="action-btn secondary"
            type="button"
            :disabled="isAnyAiBusy"
            @click="$emit('regenerate')"
          >
            <RefreshCw :size="13" />
            <span>重新整理</span>
          </button>

          <div class="footer-right">
            <button class="action-btn text-btn" type="button" @click="$emit('close')">取消</button>
            <button
              class="action-btn primary"
              type="button"
              :disabled="isStale"
              @click="$emit('apply')"
            >
              <Check :size="14" stroke-width="2.2" />
              <span>采用此建议</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { Check, CircleAlert, RefreshCw, Sparkles, X } from '@lucide/vue';

const props = defineProps<{
  aiPreview: any;
  isStale: boolean;
  isAnyAiBusy: boolean;
}>();

defineEmits<{
  (e: 'close'): void;
  (e: 'apply'): void;
  (e: 'regenerate'): void;
}>();

const modalElement = ref<HTMLElement | null>(null);

const hasValues = computed(() => props.aiPreview && Object.keys(props.aiPreview.values || {}).length > 0);

function formatKey(key: string): string {
  if (key.includes('.')) return key.split('.').pop() || key;
  return key;
}

onMounted(() => {
  modalElement.value?.focus();
});
</script>

<style scoped>
.ai-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(20, 18, 15, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.ai-modal-card {
  width: min(580px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  outline: none;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  background: var(--paper-subtle);
  border-bottom: 1px solid var(--border-hairline);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-seal {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  background: var(--cinnabar);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 10.5px;
  font-weight: 600;
}

.modal-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-heading);
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  background: transparent;
  border: none;
  border-radius: var(--radius-sm);
  color: var(--ink-muted);
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: var(--paper-base);
  color: var(--ink-heading);
}

.modal-stale-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--brass-soft);
  color: var(--brass);
  font-size: 12px;
  border-bottom: 1px solid var(--brass-border);
}

.modal-body-scroll {
  padding: 16px 18px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section-label {
  margin: 0 0 4px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.summary-box,
.rationale-box {
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  padding: 10px 12px;
}

.summary-text,
.rationale-text {
  margin: 0;
  font-size: 13px;
  color: var(--ink-body);
  line-height: 1.55;
}

.constraints-list {
  margin: 0;
  padding-left: 18px;
  font-size: 12.5px;
  color: var(--ink-body);
  line-height: 1.5;
}

.values-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.value-item {
  display: flex;
  gap: 8px;
  padding: 6px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-sm);
  font-size: 12px;
}

.value-key {
  font-weight: 600;
  color: var(--ink-muted);
  min-width: 80px;
  flex-shrink: 0;
}

.value-val {
  color: var(--ink-body);
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  background: var(--paper-subtle);
  border-top: 1px solid var(--border-hairline);
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: 12.5px;
  font-weight: 500;
  transition: all 0.18s ease;
}

.action-btn.primary {
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar-hover);
  color: #fff;
}

.action-btn.primary:hover:not(:disabled) {
  background: var(--cinnabar-hover);
}

.action-btn.secondary {
  background: var(--paper-base);
  border: 1px solid var(--border-subtle);
  color: var(--ink-heading);
}

.action-btn.secondary:hover:not(:disabled) {
  background: var(--paper-elevated);
  border-color: var(--brass-border);
}

.action-btn.text-btn {
  background: transparent;
  border: none;
  color: var(--ink-muted);
}

.action-btn.text-btn:hover {
  color: var(--ink-heading);
}

.action-btn:disabled {
  opacity: 0.5;
}

/* Modal animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>

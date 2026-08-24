<template>
  <footer class="dossier-action-footer">
    <div v-if="statusMessage" class="status-toast" :class="statusType">
      <span class="status-dot"></span>
      <span class="status-text">{{ statusMessage }}</span>
    </div>

    <div class="footer-buttons">
      <div class="left-actions">
        <button
          v-if="currentLayer > 0"
          class="nav-btn prev-btn"
          type="button"
          @click="$emit('previous')"
        >
          <ChevronLeft :size="16" />
          <span>上一层</span>
        </button>

        <button
          class="bulk-ai-btn"
          type="button"
          :class="{ 'is-busy': isAiBusy === 'bulk' }"
          :disabled="Boolean(isAiBusy)"
          @click="$emit('completeRemaining')"
        >
          <WandSparkles :size="14" />
          <span>{{ isAiBusy === 'bulk' ? '正在补全空白…' : '补全本层空白' }}</span>
        </button>
      </div>

      <div class="right-actions">
        <button
          v-if="!isLastLayer"
          class="nav-btn next-btn"
          type="button"
          @click="$emit('next')"
        >
          <span>进入下一层</span>
          <ChevronRight :size="16" />
        </button>

        <button
          v-else
          class="nav-btn sign-btn"
          type="button"
          @click="$emit('scrollToSigning')"
        >
          <Stamp :size="15" />
          <span>前往签发开局</span>
        </button>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Stamp, WandSparkles } from '@lucide/vue';

defineProps<{
  currentLayer: number;
  isLastLayer: boolean;
  isAiBusy: string;
  statusMessage: string;
  statusType: '' | 'working' | 'success' | 'error';
}>();

defineEmits<{
  (e: 'previous'): void;
  (e: 'next'): void;
  (e: 'completeRemaining'): void;
  (e: 'scrollToSigning'): void;
}>();
</script>

<style scoped>
.dossier-action-footer {
  position: sticky;
  bottom: 8px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--paper-overlay);
  backdrop-filter: blur(12px) saturate(160%);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 10px 16px;
  box-shadow: var(--shadow-md);
  margin-top: 20px;
}

.status-toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.4;
  animation: fadeIn 0.2s ease;
}

.status-toast.working {
  background: var(--brass-soft);
  color: var(--brass);
}

.status-toast.success {
  background: var(--cinnabar-soft);
  color: var(--cinnabar);
}

.status-toast.error {
  background: oklch(0.5 0.18 25 / 0.15);
  color: oklch(0.5 0.2 25);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.footer-buttons {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.prev-btn {
  background: var(--paper-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--ink-body);
}

.prev-btn:hover {
  background: var(--paper-subtle);
  border-color: var(--brass-border);
}

.next-btn {
  background: var(--paper-elevated);
  border: 1px solid var(--brass-border);
  color: var(--brass);
}

.next-btn:hover {
  background: var(--brass-soft);
  color: var(--ink-heading);
}

.sign-btn {
  background: var(--cinnabar);
  border: 1px solid var(--cinnabar-hover);
  color: #fff;
  box-shadow: 0 2px 8px var(--cinnabar-glow);
}

.sign-btn:hover {
  background: var(--cinnabar-hover);
  transform: translateY(-1px);
}

.bulk-ai-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 8px 14px;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  font-size: 12.5px;
  font-weight: 500;
  color: var(--cinnabar);
  transition: all 0.18s ease;
}

.bulk-ai-btn:hover:not(:disabled) {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
}

.bulk-ai-btn:disabled {
  opacity: 0.5;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 600px) {
  .dossier-action-footer {
    padding: 8px 10px;
  }
  .nav-btn {
    padding: 7px 12px;
    font-size: 12px;
  }
  .bulk-ai-btn {
    padding: 7px 10px;
    font-size: 11.5px;
  }
}
</style>

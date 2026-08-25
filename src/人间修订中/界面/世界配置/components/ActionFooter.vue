<template>
  <footer class="dossier-action-footer" :class="{ 'has-plan-actions': isLastLayer }">
    <div v-if="statusMessage" class="status-toast" :class="statusType">
      <span class="status-dot"></span>
      <span class="status-text">{{ statusMessage }}</span>
    </div>

    <div class="footer-buttons">
      <div class="left-actions">
        <button v-if="currentLayer > 0" class="nav-btn prev-btn" type="button" @click="$emit('previous')">
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
        <button v-if="!isLastLayer" class="nav-btn next-btn" type="button" @click="$emit('next')">
          <span>进入下一层</span>
          <ChevronRight :size="16" />
        </button>

        <div v-else class="plan-save-actions">
          <template v-if="hasCurrentPlan">
            <span class="plan-source-label" :title="`当前内容源自：${currentPlanName}`">
              源自：{{ currentPlanName }}
            </span>
            <button class="plan-save-btn" type="button" @click="$emit('updateCurrentPlan')">更新当前方案</button>
            <button class="plan-save-btn secondary" type="button" @click="$emit('saveAsPlan')">另存为</button>
          </template>
          <button v-else class="plan-save-btn" type="button" @click="$emit('saveNewPlan')">保存为新方案</button>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, WandSparkles } from '@lucide/vue';

defineProps<{
  currentLayer: number;
  isLastLayer: boolean;
  isAiBusy: string;
  statusMessage: string;
  statusType: '' | 'working' | 'success' | 'error';
  currentPlanName: string;
  hasCurrentPlan: boolean;
}>();

defineEmits<{
  (e: 'previous'): void;
  (e: 'next'): void;
  (e: 'completeRemaining'): void;
  (e: 'saveNewPlan'): void;
  (e: 'updateCurrentPlan'): void;
  (e: 'saveAsPlan'): void;
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
  min-width: 0;
}

.left-actions,
.right-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
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

.plan-save-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
  flex-wrap: wrap;
}

.plan-source-label {
  flex: 1 1 150px;
  max-width: 220px;
  min-width: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-save-btn {
  flex: 0 0 auto;
  padding: 5px 9px;
  background: transparent;
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-pill);
  color: var(--ink-muted);
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.plan-save-btn:hover {
  background: var(--brass-soft);
  border-color: var(--brass-border);
  color: var(--brass);
}

.plan-save-btn.secondary {
  color: var(--cinnabar);
}

.plan-save-btn.secondary:hover {
  background: var(--cinnabar-soft);
  border-color: var(--cinnabar);
  color: var(--cinnabar);
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
  .dossier-action-footer.has-plan-actions .footer-buttons {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .dossier-action-footer.has-plan-actions .right-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .dossier-action-footer.has-plan-actions .plan-save-actions {
    width: 100%;
    justify-content: flex-start;
  }
  .dossier-action-footer.has-plan-actions .plan-source-label {
    flex-basis: 100%;
    max-width: 100%;
  }
}
</style>

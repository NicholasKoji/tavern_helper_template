<template>
  <nav class="step-wizard-nav" aria-label="创作访谈分步导航">
    <div class="step-track">
      <button
        v-for="(layer, index) in layers"
        :key="layer.id"
        class="step-item"
        :class="{
          'is-active': index === currentLayer,
          'is-completed': index < maxVisitedLayer,
          'is-disabled': index > maxVisitedLayer,
        }"
        :disabled="index > maxVisitedLayer"
        type="button"
        :aria-current="index === currentLayer ? 'step' : undefined"
        @click="$emit('goToLayer', index)"
      >
        <span class="step-indicator">
          <Check v-if="index < maxVisitedLayer" :size="13" stroke-width="2.5" class="step-check" />
          <span v-else class="step-num">{{ layer.order }}</span>
        </span>
        <div class="step-copy">
          <span class="step-kicker">{{ layer.kicker }}</span>
          <strong class="step-title">{{ layer.title }}</strong>
        </div>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue';

defineProps<{
  layers: ReadonlyArray<{
    id: string;
    kicker: string;
    order: string;
    title: string;
    description: string;
    icon: any;
  }>;
  currentLayer: number;
  maxVisitedLayer: number;
}>();

defineEmits<{
  (e: 'goToLayer', index: number): void;
}>();
</script>

<style scoped>
.step-wizard-nav {
  position: relative;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 8px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
  overflow-x: auto;
  scrollbar-width: none;
}

.step-wizard-nav::-webkit-scrollbar {
  display: none;
}

.step-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  min-width: 580px;
}

.step-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--ink-muted);
}

.step-item:hover:not(:disabled) {
  background: var(--paper-subtle);
  color: var(--ink-body);
}

.step-item.is-active {
  background: var(--paper-subtle);
  border-color: var(--border-subtle);
  color: var(--ink-heading);
  box-shadow: var(--shadow-sm);
}

.step-item.is-completed:not(.is-active) {
  color: var(--ink-body);
}

.step-item:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  background: var(--paper-base);
  border: 1px solid var(--border-subtle);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-muted);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.step-item.is-active .step-indicator {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #fff;
  box-shadow: 0 0 0 2px var(--cinnabar-soft);
}

.step-item.is-completed .step-indicator {
  background: var(--brass-soft);
  border-color: var(--brass-border);
  color: var(--brass);
}

.step-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.step-kicker {
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  line-height: 1.2;
}

.step-title {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .step-wizard-nav {
    padding: 6px;
  }
  .step-track {
    display: flex;
    min-width: max-content;
  }
  .step-item {
    padding: 6px 10px;
    gap: 8px;
  }
}
</style>

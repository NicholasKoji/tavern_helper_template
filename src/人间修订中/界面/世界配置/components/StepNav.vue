<template>
  <nav ref="nav" class="step-wizard-nav" aria-label="开场配置分步导航">
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
import { ref, watch, nextTick } from 'vue';
import { Check } from '@lucide/vue';

const props = defineProps<{
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
const nav = ref<HTMLElement | null>(null);
watch(
  () => props.currentLayer,
  async () => {
    await nextTick();
    const container = nav.value;
    const active = container?.querySelector<HTMLElement>('.is-active');
    if (!container || !active) return;
    const outer = container.getBoundingClientRect();
    const inner = active.getBoundingClientRect();
    if (inner.left < outer.left + 8) container.scrollLeft += inner.left - outer.left - 8;
    else if (inner.right > outer.right - 8) container.scrollLeft += inner.right - outer.right + 8;
  },
);
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
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--border-subtle) transparent;
}

.step-wizard-nav::-webkit-scrollbar {
  height: 3px;
}

.step-wizard-nav::-webkit-scrollbar-track {
  background: transparent;
}

.step-wizard-nav::-webkit-scrollbar-thumb {
  background: var(--border-subtle);
  border-radius: var(--radius-pill);
}

.step-track {
  display: flex;
  flex-wrap: nowrap;
  gap: 6px;
  width: max-content;
  min-width: 100%;
  box-sizing: border-box;
}

.step-item {
  flex: 1 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  text-align: left;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  color: var(--ink-muted);
  min-width: 0;
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
  width: 24px;
  height: 24px;
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
  overflow: hidden;
}

.step-kicker {
  font-size: 12px;
  font-family: var(--font-mono);
  letter-spacing: 0.05em;
  color: var(--ink-muted);
  line-height: 1.2;
}

.step-title {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}
</style>

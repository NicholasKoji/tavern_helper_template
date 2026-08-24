<template>
  <nav class="status-tabs-nav" role="tablist" aria-label="状态栏视图切换">
    <div class="tabs-track">
      <button
        v-for="tab in tabs"
        :id="`tab-${tab.id}`"
        :key="tab.id"
        class="tab-btn"
        :class="{ active: modelValue === tab.id }"
        role="tab"
        type="button"
        :aria-selected="modelValue === tab.id"
        :aria-controls="`panel-${tab.id}`"
        :tabindex="modelValue === tab.id ? 0 : -1"
        @click="$emit('update:modelValue', tab.id)"
        @keydown="onKeydown"
      >
        <component :is="tab.icon" :size="15" stroke-width="2" class="tab-icon" />
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge !== undefined && tab.badge > 0" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  tabs: ReadonlyArray<{
    id: string;
    label: string;
    icon: any;
    badge?: number;
  }>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', id: string): void;
}>();

function onKeydown(event: KeyboardEvent) {
  const target = event.currentTarget as HTMLButtonElement;
  const id = target.id.replace('tab-', '');
  const currentIndex = props.tabs.findIndex(tab => tab.id === id);
  if (currentIndex < 0) return;

  let nextIndex: number;
  if (event.key === 'ArrowRight') {
    nextIndex = (currentIndex + 1) % props.tabs.length;
  } else if (event.key === 'ArrowLeft') {
    nextIndex = (currentIndex - 1 + props.tabs.length) % props.tabs.length;
  } else if (event.key === 'Home') {
    nextIndex = 0;
  } else if (event.key === 'End') {
    nextIndex = props.tabs.length - 1;
  } else {
    return;
  }
  event.preventDefault();
  const nextTab = props.tabs[nextIndex];
  if (nextTab) {
    emit('update:modelValue', nextTab.id);
    requestAnimationFrame(() => document.getElementById(`tab-${nextTab.id}`)?.focus());
  }
}
</script>

<style scoped>
.status-tabs-nav {
  background: var(--paper-elevated);
  border-bottom: 1px solid var(--border-hairline);
  padding: 6px 12px;
}

.tabs-track {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--ink-muted);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.18s ease;
}

.tab-btn:hover {
  background: var(--paper-subtle);
  color: var(--ink-body);
}

.tab-btn.active {
  background: var(--cinnabar);
  border-color: var(--cinnabar);
  color: #fff;
  box-shadow: 0 1px 6px var(--cinnabar-soft);
}

.tab-icon {
  flex-shrink: 0;
}

.tab-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.25);
  line-height: 1.2;
}

.tab-btn:not(.active) .tab-badge {
  background: var(--brass-soft);
  color: var(--brass);
}
</style>

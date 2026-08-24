<template>
  <aside class="dossier-summary-panel">
    <header class="summary-header">
      <div class="header-left">
        <span class="summary-badge">已录入卷宗</span>
        <h3 class="summary-title">设定简报</h3>
      </div>
      <div class="progress-pill">
        <span class="progress-num">{{ completedCount }}</span>
        <span class="progress-total">/ 5 层已填</span>
      </div>
    </header>

    <div class="summary-list">
      <div
        v-for="row in contextRows"
        :key="row.id"
        class="summary-card"
        :class="{
          'is-complete': row.complete,
          'is-current': row.index === currentLayer,
        }"
        @click="$emit('goToLayer', row.index)"
      >
        <div class="card-top">
          <span class="card-order">{{ row.order }}</span>
          <strong class="card-layer-title">{{ row.title }}</strong>
          <span class="card-status-dot" :class="{ filled: row.complete }"></span>
        </div>
        <p class="card-summary-content">{{ row.summary }}</p>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
defineProps<{
  contextRows: Array<{
    id: string;
    index: number;
    order: string;
    title: string;
    summary: string;
    complete: boolean;
  }>;
  completedCount: number;
  currentLayer: number;
}>();

defineEmits<{
  (e: 'goToLayer', index: number): void;
}>();
</script>

<style scoped>
.dossier-summary-panel {
  display: flex;
  flex-direction: column;
  background: var(--paper-elevated);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  gap: 12px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-hairline);
}

.summary-badge {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.summary-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  color: var(--ink-heading);
}

.progress-pill {
  display: inline-flex;
  align-items: baseline;
  gap: 2px;
  padding: 3px 8px;
  background: var(--brass-soft);
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 11px;
}

.progress-num {
  font-weight: 700;
  color: var(--brass);
}

.progress-total {
  color: var(--ink-muted);
  font-size: 10px;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-card {
  padding: 8px 10px;
  background: var(--paper-base);
  border: 1px solid var(--border-hairline);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.18s ease;
}

.summary-card:hover {
  background: var(--paper-subtle);
  border-color: var(--border-subtle);
}

.summary-card.is-current {
  border-color: var(--brass-border);
  background: var(--paper-subtle);
  box-shadow: var(--shadow-sm);
}

.card-top {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}

.card-order {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--brass);
}

.card-layer-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-heading);
  flex: 1;
}

.card-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--border-subtle);
  transition: background-color 0.2s ease;
}

.card-status-dot.filled {
  background: var(--cinnabar);
}

.card-summary-content {
  margin: 0;
  font-size: 11.5px;
  color: var(--ink-muted);
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>

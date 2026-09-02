<template>
  <section class="meta-strip" aria-label="当前场景元信息">
    <div class="meta-item">
      <span class="meta-label">
        <CalendarDays :size="12" stroke-width="1.8" />
        <span>日期</span>
      </span>
      <span class="meta-value">{{ formatDate }}</span>
    </div>

    <div class="meta-item">
      <span class="meta-label">
        <Clock3 :size="12" stroke-width="1.8" />
        <span>时间</span>
      </span>
      <span class="meta-value">{{ formatTime }}</span>
    </div>

    <div class="meta-item location-item">
      <span class="meta-label">
        <MapPin :size="12" stroke-width="1.8" />
        <span>地点</span>
      </span>
      <span class="meta-value" :title="formatLocation">{{ formatLocation }}</span>
    </div>

    <div class="meta-item summary-item">
      <span class="meta-label">
        <ScrollText :size="12" stroke-width="1.8" />
        <span>摘要</span>
      </span>
      <span class="meta-value summary-text" :title="summary">{{ summary || '暂无摘要' }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
import { CalendarDays, Clock3, MapPin, ScrollText } from '@lucide/vue';

defineProps<{
  formatDate: string;
  formatTime: string;
  formatLocation: string;
  summary: string;
}>();
</script>

<style scoped>
.meta-strip {
  display: grid;
  grid-template-columns: 140px 100px minmax(0, 1.2fr) minmax(0, 1.8fr);
  gap: 1px;
  background: var(--border-hairline);
  border-bottom: 1px solid var(--border-hairline);
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 8px 12px;
  background: var(--paper-subtle);
  min-width: 0;
}

.meta-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  color: var(--ink-muted);
  letter-spacing: 0.05em;
}

.meta-value {
  font-size: 12.5px;
  color: var(--ink-heading);
  white-space: normal;
  word-break: break-word;
  line-height: 1.5;
}

.summary-text {
  font-size: 12px;
  color: var(--ink-body);
  line-height: 1.6;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 720px) {
  .meta-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .location-item,
  .summary-item {
    grid-column: span 2;
  }
}
</style>

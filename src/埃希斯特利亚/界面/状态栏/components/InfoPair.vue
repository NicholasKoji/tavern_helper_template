<template>
  <div class="info-pair">
    <span>{{ label }}</span>
    <strong>{{ value || '暂无记录' }}</strong>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
}>();
</script>

<style lang="scss" scoped>
.info-pair {
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 9px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.12);
}

.info-pair span {
  color: var(--text-muted);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 11px;
}

.info-pair strong {
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-main);
  font-size: 13px;
  font-weight: 600;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>

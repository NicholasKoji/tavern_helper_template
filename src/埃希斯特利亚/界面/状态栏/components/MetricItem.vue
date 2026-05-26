<template>
  <div class="metric-item">
    <div class="metric-copy">
      <span>{{ label }}</span>
      <strong>{{ value }}</strong>
    </div>
    <div class="meter-track" aria-hidden="true">
      <span :style="{ width: `${width}%` }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string;
  width: number;
}>();
</script>

<style lang="scss" scoped>
.metric-item {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.5);
}

.metric-copy {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.metric-copy span {
  color: rgba(32, 49, 58, 0.58);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 11px;
  letter-spacing: 0;
}

.metric-copy strong {
  color: var(--drawer-text);
}

.meter-track {
  width: 100%;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(32, 49, 58, 0.16);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.16);
}

.meter-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--icon-cyan), #9ee9f1);
}
</style>

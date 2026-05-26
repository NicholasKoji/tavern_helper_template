<template>
  <article class="record-block">
    <span>{{ title }}</span>
    <p>{{ text || '暂无记录。' }}</p>
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  text: string;
}>();
</script>

<style lang="scss" scoped>
.record-block {
  display: grid;
  gap: 5px;
  padding: 12px;
  border: 1px solid var(--drawer-line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.48);
}

.record-block span {
  color: rgba(32, 49, 58, 0.58);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.record-block p {
  margin: 0;
  color: var(--drawer-text);
  font-family:
    ui-sans-serif,
    'Microsoft YaHei',
    sans-serif;
  font-size: 13px;
}
</style>

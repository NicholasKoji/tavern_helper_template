<template>
  <div class="drawer-mask">
    <section class="detail-drawer" :class="`detail-drawer--${tone}`">
      <div class="drawer-handle"></div>
      <header class="drawer-title">
        <StatusIcon name="shield" :tone="tone" />
        <h2>{{ title }}</h2>
        <button type="button" title="关闭" @click="$emit('close')">×</button>
      </header>
      <div class="drawer-content">
        <slot />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import StatusIcon from './StatusIcon.vue';

withDefaults(
  defineProps<{
    title: string;
    tone?: 'blue' | 'red';
  }>(),
  { tone: 'blue' },
);

defineEmits<{
  close: [];
}>();
</script>

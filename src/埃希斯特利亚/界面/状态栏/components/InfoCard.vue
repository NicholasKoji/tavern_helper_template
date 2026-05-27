<template>
  <article class="info-card">
    <header v-if="title || icon" class="info-card-head">
      <StatusIcon v-if="icon" :name="icon" :tone="tone" />
      <h3 v-if="title">{{ title }}</h3>
    </header>
    <slot />
  </article>
</template>

<script setup lang="ts">
import StatusIcon from './StatusIcon.vue';

withDefaults(
  defineProps<{
    title?: string;
    icon?: string;
    tone?: 'blue' | 'red' | 'neutral' | 'amber';
  }>(),
  { title: '', icon: '', tone: 'neutral' },
);
</script>

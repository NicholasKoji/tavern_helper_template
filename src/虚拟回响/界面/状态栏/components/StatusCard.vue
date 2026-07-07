<template>
  <article class="card">
    <div class="card-header">
      <h2 class="card-title">
        <slot name="icon" />
        {{ title }}
      </h2>
      <span v-if="tag" class="status-tag">{{ tag }}</span>
    </div>
    <slot />
  </article>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  tag?: string | number;
}>();
</script>

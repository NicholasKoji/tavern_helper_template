<template>
  <span class="status-icon" :class="[`status-icon--${tone}`, `status-icon--${name}`]" aria-hidden="true">
    <svg viewBox="0 0 24 24" role="img">
      <path v-if="name === 'shield'" d="M12 2.8 19 5.6v5.7c0 4.5-2.8 8.2-7 9.9-4.2-1.7-7-5.4-7-9.9V5.6L12 2.8Z" />
      <path v-else-if="name === 'clock'" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3.5V12l3 2" />
      <path
        v-else-if="name === 'pin'"
        d="M12 21s6-5.4 6-11a6 6 0 0 0-12 0c0 5.6 6 11 6 11Zm0-8.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z"
      />
      <path v-else-if="name === 'cloud'" d="M7.2 18h10.2a4 4 0 0 0 .3-8 6 6 0 0 0-11.3-1.7A4.9 4.9 0 0 0 7.2 18Z" />
      <path v-else-if="name === 'heart'" d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
      <path
        v-else-if="name === 'brain'"
        d="M8.4 17.8a3.4 3.4 0 0 1-1.7-6.3 3.2 3.2 0 0 1 3.1-4.4 3 3 0 0 1 5.2.1 3.3 3.3 0 0 1 2.4 5.6 3.3 3.3 0 0 1-2.9 5H8.4Z"
      />
      <path v-else-if="name === 'person'" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" />
      <path v-else-if="name === 'list'" d="M8 6h11M8 12h11M8 18h11M4.5 6h.1M4.5 12h.1M4.5 18h.1" />
      <path v-else-if="name === 'suit'" d="M8 4h8l2 4-2 12H8L6 8l2-4Zm4 0v16" />
      <path v-else-if="name === 'wheel'" d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3v10M7 12h10m-8.5-3.5 7 7m0-7-7 7" />
      <path v-else-if="name === 'seat'" d="M8 5v9h8.8a2.2 2.2 0 0 0 0-4.4H12V5H8Zm0 9v5m8-5v5" />
      <path v-else-if="name === 'speed'" d="M5 17a7 7 0 0 1 14 0M12 17l4-6M8 17h8" />
      <path v-else-if="name === 'road'" d="M9 20 11 4h2l2 16M7 20h10M12 8v2m0 3v2" />
      <path v-else-if="name === 'target'" d="M12 4v3m0 10v3m8-8h-3M7 12H4m4.5 0a3.5 3.5 0 1 0 7 0 3.5 3.5 0 0 0-7 0Z" />
      <path
        v-else-if="name === 'body'"
        d="M12 4c2.4 2.8 3.3 5.8 2.2 9-.6 1.8-.5 4.1.8 7M12 4C9.6 6.8 8.7 9.8 9.8 13c.6 1.8.5 4.1-.8 7"
      />
      <path v-else d="M5 12h14" />
    </svg>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  name: string;
  tone?: 'blue' | 'red' | 'neutral' | 'amber';
}>();
</script>

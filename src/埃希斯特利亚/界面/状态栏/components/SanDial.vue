<template>
  <div class="san-dial" :class="`san-dial--${tone.color}`">
    <span class="san-label">SAN</span>
    <svg class="san-ring" viewBox="0 0 120 120" aria-label="SAN value">
      <circle class="san-ring-bg" cx="60" cy="60" r="48" />
      <circle class="san-ring-fill" cx="60" cy="60" r="48" :style="{ strokeDashoffset }" />
    </svg>
    <span class="san-number">{{ value }}</span>
    <svg class="san-pulse" viewBox="0 0 120 22" aria-hidden="true">
      <path d="M2 12h45l6-8 9 16 7-8h49" />
    </svg>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  value: number;
  tone: { color: string; label: string };
}>();

const strokeDashoffset = computed(() => {
  const circumference = 2 * Math.PI * 48;
  return circumference - (Math.max(0, Math.min(100, props.value)) / 100) * circumference;
});
</script>

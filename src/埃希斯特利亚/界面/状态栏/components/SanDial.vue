<template>
  <div class="san-dial" :class="`san-dial--${tone.color}`">
    <span class="san-label">SAN</span>
    <div class="san-orbit">
      <svg class="san-ring" viewBox="0 0 120 120" aria-label="SAN value">
        <circle class="san-ring-shadow" cx="60" cy="60" r="46" />
        <circle class="san-ring-bg" cx="60" cy="60" r="46" />
        <circle class="san-ring-fill" cx="60" cy="60" r="46" :style="{ strokeDasharray, strokeDashoffset }" />
        <circle class="san-inner-rim" cx="60" cy="60" r="31" />
      </svg>
      <span class="san-number">{{ value }}</span>
    </div>
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

const strokeDasharray = 2 * Math.PI * 46;
const visualArc = 0.8;

const strokeDashoffset = computed(() => {
  return strokeDasharray - (Math.max(0, Math.min(100, props.value)) / 100) * strokeDasharray * visualArc;
});
</script>

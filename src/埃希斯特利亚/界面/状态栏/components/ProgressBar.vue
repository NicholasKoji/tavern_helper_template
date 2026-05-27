<template>
  <div class="progress-wrap">
    <div class="progress-track">
      <div class="progress-fill" :class="`progress-fill--${tone}`" :style="{ width: percent + '%' }"></div>
    </div>
    <span v-if="showValue" class="progress-value"
      >{{ value }}<small v-if="suffix">{{ suffix }}</small></span
    >
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    value: number;
    max?: number;
    tone?: 'blue' | 'red' | 'amber';
    suffix?: string;
    showValue?: boolean;
  }>(),
  {
    max: 100,
    tone: 'blue',
    suffix: '',
    showValue: false,
  },
);

const percent = computed(() => Math.max(0, Math.min(100, (props.value / props.max) * 100)));
</script>

<template>
  <div :class="level > 0 ? 'subtree' : 'accordions'">
    <template v-for="[key, value] in visibleEntries" :key="`${parentKey}:${key}`">
      <details v-if="isRecord(value)" :open="isOpen(key)">
        <summary>{{ key }}</summary>
        <div class="detail-body">
          <DataTree :data="value" :level="level + 1" :parent-key="key" :options="options" />
        </div>
      </details>
      <div v-else class="data-row">
        <div class="data-key">{{ key }}</div>
        <div class="data-val">{{ formatValue(value) }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { AnyRecord } from '../store';

interface TreeOptions {
  omitBaseName?: boolean;
  forceOpen?: string[];
  forceOpenChildrenOf?: string[];
}

const props = withDefaults(
  defineProps<{
    data: AnyRecord;
    level?: number;
    parentKey?: string;
    options?: TreeOptions;
  }>(),
  {
    level: 0,
    parentKey: '',
    options: () => ({}),
  },
);

const visibleEntries = computed(() =>
  Object.entries(props.data).filter(
    ([key]) => !(props.parentKey === '基础信息' && key === '姓名' && props.options.omitBaseName),
  ),
);

function isRecord(value: unknown): value is AnyRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function formatValue(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '待记录';
  }
  return String(value);
}

function isOpen(key: string) {
  if (props.options.forceOpen?.includes(key)) {
    return true;
  }
  if (props.options.forceOpenChildrenOf?.includes(props.parentKey)) {
    return true;
  }
  if (['私密状态', '穿着', '外貌'].includes(key)) {
    return false;
  }
  return props.level === 0 || props.parentKey === '私密状态';
}
</script>

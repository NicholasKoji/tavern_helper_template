<template>
  <div class="detail-stack">
    <InfoCard
      v-for="[item_name, item] in entries"
      :key="item_name"
      :title="item_name"
      :icon="iconFor(item_name)"
      tone="red"
    >
      <dl class="key-grid two">
        <dt>状态</dt>
        <dd>
          <span class="pill red">{{ item.状态 }}</span>
        </dd>
        <dt>描述</dt>
        <dd>{{ item.描述 }}</dd>
      </dl>
    </InfoCard>
    <p v-if="entries.length === 0" class="empty-text">{{ name }} 当前没有装备记录。</p>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';

const props = defineProps<{
  name: string;
  equipment: Schema['女骑'][string]['装备'];
}>();

const entries = computed(() => Object.entries(props.equipment));

function iconFor(name: string) {
  if (name.includes('座椅')) {
    return 'seat';
  }
  if (name.includes('轮组')) {
    return 'wheel';
  }
  return 'suit';
}
</script>

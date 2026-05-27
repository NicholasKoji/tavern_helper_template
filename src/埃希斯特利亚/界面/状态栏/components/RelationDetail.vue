<template>
  <div class="detail-stack">
    <InfoCard title="身份" icon="person" tone="red"
      ><p>{{ rider.身份 }}</p></InfoCard
    >
    <InfoCard title="所属骑士" icon="shield" tone="red"
      ><p>{{ rider.所属骑士 }}</p></InfoCard
    >
    <InfoCard title="所属关系" icon="heart" tone="red"
      ><p>{{ rider.所属关系 }}</p></InfoCard
    >
    <InfoCard title="关系背景" icon="list" tone="red"
      ><p>{{ rider.关系背景 }}</p></InfoCard
    >
    <p class="subnote">{{ name }} 的关系信息来自 MVU 变量当前楼层。</p>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';

defineProps<{
  name: string;
  rider: Schema['女骑'][string];
}>();
</script>

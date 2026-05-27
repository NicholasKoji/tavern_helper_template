<template>
  <div class="detail-stack">
    <InfoCard v-for="item in items" :key="item.key" :title="item.label" icon="person" tone="red">
      <p>{{ item.value }}</p>
    </InfoCard>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';

const props = defineProps<{
  name: string;
  appearance: Schema['女骑'][string]['外貌'];
}>();

const items = computed(() =>
  [
    ['体型', props.appearance.体型],
    ['头发', props.appearance.头发],
    ['眉眼', props.appearance.眉眼],
    ['鼻梁', props.appearance.鼻梁],
    ['唇口', props.appearance.唇口],
    ['脸部轮廓', props.appearance.脸部轮廓],
    ['皮肤', props.appearance.皮肤],
  ].map(([label, value]) => ({ key: label, label, value })),
);
</script>

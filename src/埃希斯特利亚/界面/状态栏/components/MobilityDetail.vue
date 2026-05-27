<template>
  <div class="detail-stack">
    <section class="mobility-head">
      <StatusIcon name="shield" tone="red" />
      <div>
        <h3>机动能力</h3>
        <p>{{ name }}</p>
      </div>
      <div class="energy-mini">
        <span>体力 {{ rider.体力 }}</span>
        <ProgressBar :value="rider.体力" tone="red" />
      </div>
    </section>

    <InfoCard v-for="metric in metrics" :key="metric.key" :title="metric.label" :icon="metric.icon" tone="blue">
      <div class="metric-row">
        <ProgressBar :value="metric.percent" :max="100" tone="blue" />
        <strong
          >{{ metric.value }} <small>{{ metric.unit }}</small></strong
        >
      </div>
      <p class="metric-note">{{ metric.note }}</p>
    </InfoCard>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';
import ProgressBar from './ProgressBar.vue';
import StatusIcon from './StatusIcon.vue';

const props = defineProps<{
  name: string;
  rider: Schema['女骑'][string];
}>();

const metrics = computed(() => {
  const ability = props.rider.机动能力;
  return [
    {
      key: 'speed',
      label: '最高时速',
      icon: 'speed',
      value: ability.最高时速.数值,
      unit: ability.最高时速.单位,
      percent: (ability.最高时速.数值 / 70) * 100,
      note: '冲刺瞬时最高速度',
    },
    {
      key: 'range',
      label: '巡航距离',
      icon: 'road',
      value: ability.巡航距离.数值,
      unit: ability.巡航距离.单位,
      percent: (ability.巡航距离.数值 / 36) * 100,
      note: '标准巡航状态下可持续距离',
    },
    {
      key: 'stability',
      label: '承载稳定',
      icon: 'shield',
      value: ability.承载稳定.数值,
      unit: ability.承载稳定.单位,
      percent: (ability.承载稳定.数值 / 4) * 100,
      note: '动态负载下的稳定性',
    },
    {
      key: 'response',
      label: '操控响应',
      icon: 'target',
      value: ability.操控响应.数值,
      unit: ability.操控响应.单位,
      percent: (ability.操控响应.数值 / 1) * 100,
      note: '从指令到动作生效的延迟',
    },
    {
      key: 'efficiency',
      label: '动力转化效率',
      icon: 'wheel',
      value: ability.动力转化效率.数值,
      unit: '%',
      percent: ability.动力转化效率.数值,
      note: '能量转化为动能的效率',
    },
  ];
});
</script>

<template>
  <div class="detail-stack">
    <InfoCard title="时间" icon="clock" tone="blue">
      <p class="large-line">
        {{ scene.时间.年 }}年{{ scene.时间.月 }}月{{ scene.时间.日 }}日 {{ padded(scene.时间.时) }}:{{
          padded(scene.时间.分)
        }}
      </p>
    </InfoCard>
    <InfoCard title="地点" icon="pin" tone="blue">
      <dl class="key-grid">
        <dt>一级区域</dt>
        <dd>{{ scene.地点.一级区域 }}</dd>
        <dt>二级区域</dt>
        <dd>{{ scene.地点.二级区域 }}</dd>
        <dt>三级区域</dt>
        <dd>{{ scene.地点.三级区域 }}</dd>
      </dl>
    </InfoCard>
    <InfoCard title="天气" icon="cloud" tone="blue">
      <dl class="key-grid two">
        <dt>概况</dt>
        <dd>{{ scene.天气.概况 }}</dd>
        <dt>气温</dt>
        <dd>{{ scene.天气.气温.数值 }}{{ scene.天气.气温.单位 }}</dd>
        <dt>风</dt>
        <dd>{{ scene.天气.风 }}</dd>
        <dt>体感</dt>
        <dd>{{ scene.天气.体感 }}</dd>
      </dl>
    </InfoCard>
    <InfoCard title="环境" icon="road" tone="blue">
      <p>{{ scene.环境 }}</p>
    </InfoCard>
    <InfoCard title="待办事项" icon="list" tone="blue">
      <dl class="key-grid">
        <dt>主要</dt>
        <dd>{{ todos.主要 }}</dd>
        <dt>次要</dt>
        <dd>{{ todos.次要 }}</dd>
      </dl>
    </InfoCard>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';

defineProps<{
  scene: Schema['当前场景'];
  todos: Schema['待办事项'];
}>();

function padded(value: number) {
  return String(value).padStart(2, '0');
}
</script>

<template>
  <div class="detail-stack relation-detail-main">
    <p class="relation-detail-name">{{ name }}</p>

    <section class="relation-fact-row">
      <StatusIcon name="person" tone="red" />
      <strong>身份</strong>
      <span class="relation-fact-value">{{ rider.身份 }}</span>
    </section>
    <section class="relation-fact-row">
      <StatusIcon name="shield" tone="red" />
      <strong>所属骑士</strong>
      <span class="relation-fact-value">{{ rider.所属骑士 }}</span>
    </section>
    <section class="relation-fact-row">
      <StatusIcon name="heart" tone="red" />
      <strong>所属关系</strong>
      <span class="relation-fact-value">{{ rider.所属关系 }}</span>
    </section>

    <section class="relation-background-card">
      <div class="relation-section-head">
        <StatusIcon name="book" tone="red" />
        <h3>关系背景</h3>
      </div>
      <p>{{ rider.关系背景 }}</p>
    </section>

    <div v-if="duty_tags.length" class="relation-duty-tags" aria-label="关系职责">
      <span v-for="tag in duty_tags" :key="tag.icon" class="relation-duty-tag">
        <StatusIcon :name="tag.icon" tone="neutral" />
        {{ tag.label }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import StatusIcon from './StatusIcon.vue';

const props = defineProps<{
  name: string;
  rider: Schema['女骑'][string];
}>();

const duty_tags = computed(() =>
  [
    { icon: 'home', label: '共同生活', keyword: '共同生活' },
    { icon: 'person', label: '日常出行', keyword: '日常出行' },
    { icon: 'road', label: '骑乘滑行', keyword: '骑乘滑行' },
    { icon: 'suit', label: '公务随行', keyword: '公务随行' },
  ].filter(tag => props.rider.关系背景.includes(tag.keyword)),
);
</script>

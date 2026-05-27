<template>
  <div class="detail-stack body-stack">
    <InfoCard title="胸部" icon="body" tone="red">
      <dl class="key-grid">
        <dt>罩杯</dt>
        <dd>{{ body.胸部.罩杯 }}</dd>
        <dt>身材描述</dt>
        <dd>{{ body.胸部.身材描述 }}</dd>
        <dt>当前状态</dt>
        <dd>{{ body.胸部.当前状态 }}</dd>
      </dl>
    </InfoCard>
    <InfoCard title="臀部" icon="body" tone="red">
      <dl class="key-grid">
        <dt>身材描述</dt>
        <dd>{{ body.臀部.身材描述 }}</dd>
        <dt>当前状态</dt>
        <dd>{{ body.臀部.当前状态 }}</dd>
      </dl>
    </InfoCard>
    <InfoCard title="足部" icon="body" tone="red">
      <dl class="key-grid">
        <dt>身材描述</dt>
        <dd>{{ body.足部.身材描述 }}</dd>
        <dt>当前状态</dt>
        <dd>{{ body.足部.当前状态 }}</dd>
      </dl>
    </InfoCard>
    <p class="subnote">{{ name }} 的身材页只展示状态记录，不在前端推断新变量。</p>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';

defineProps<{
  name: string;
  body: Schema['女骑'][string]['身材'];
}>();
</script>

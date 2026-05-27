<template>
  <div class="detail-stack">
    <section class="profile-strip blue">
      <StatusIcon name="shield" tone="blue" />
      <div>
        <h3>{{ name }}</h3>
        <p>{{ knight.身份 }}</p>
      </div>
    </section>
    <div class="stat-grid">
      <InfoCard title="年龄" icon="person" tone="blue"
        ><p class="large-line">{{ knight.年龄 }}</p></InfoCard
      >
      <InfoCard title="好感度" icon="heart" tone="blue">
        <p class="large-line">{{ knight.好感度 }}</p>
        <ProgressBar :value="knight.好感度 + 100" :max="200" tone="blue" />
      </InfoCard>
    </div>
    <InfoCard title="外貌" icon="person" tone="blue"
      ><p>{{ knight.外貌 }}</p></InfoCard
    >
    <InfoCard title="性格" icon="shield" tone="blue"
      ><p>{{ knight.性格 }}</p></InfoCard
    >
    <InfoCard title="态度" icon="heart" tone="blue"
      ><p>{{ knight.态度 }}</p></InfoCard
    >
    <InfoCard title="当前心理" icon="brain" tone="blue"
      ><p>{{ knight.当前心理 }}</p></InfoCard
    >
    <InfoCard title="当前动作" icon="person" tone="blue"
      ><p>{{ knight.当前动作 }}</p></InfoCard
    >
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';
import ProgressBar from './ProgressBar.vue';
import StatusIcon from './StatusIcon.vue';

defineProps<{
  name: string;
  knight: Schema['骑士'][string];
}>();
</script>

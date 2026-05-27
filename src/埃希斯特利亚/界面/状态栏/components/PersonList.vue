<template>
  <section class="people-panel">
    <header class="group-head blue">
      <StatusIcon name="shield" tone="blue" />
      <strong>骑士</strong>
      <span>{{ knights.length }}</span>
    </header>
    <article
      v-for="[name, knight] in knights"
      :key="`knight-${name}`"
      class="person-row"
      @click="$emit('openKnight', name)"
    >
      <StatusIcon name="shield" tone="blue" />
      <div>
        <h3><span class="person-kind">骑士</span>{{ name }}</h3>
        <p>{{ knight.身份 }}</p>
      </div>
      <div class="row-meter">
        <span>好感度 {{ knight.好感度 }}</span>
        <ProgressBar :value="knight.好感度 + 100" :max="200" tone="blue" />
      </div>
      <button type="button" title="展开骑士详情">⌄</button>
    </article>

    <header class="group-head red">
      <StatusIcon name="shield" tone="red" />
      <strong>女骑</strong>
      <span>{{ femaleRiders.length }}</span>
    </header>
    <article
      v-for="[name, rider] in femaleRiders"
      :key="`female-${name}`"
      class="person-row red"
      @click="$emit('openFemale', name)"
    >
      <StatusIcon name="shield" tone="red" />
      <div>
        <h3><span class="person-kind">女骑</span>{{ name }}</h3>
        <p>{{ rider.身份 }}</p>
      </div>
      <div class="row-meter">
        <span>体力 {{ rider.体力 }}/100</span>
        <ProgressBar :value="rider.体力" tone="red" />
      </div>
      <button type="button" title="展开女骑详情">⌄</button>
    </article>
  </section>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import ProgressBar from './ProgressBar.vue';
import StatusIcon from './StatusIcon.vue';

defineProps<{
  knights: Array<[string, Schema['骑士'][string]]>;
  femaleRiders: Array<[string, Schema['女骑'][string]]>;
}>();

defineEmits<{
  openKnight: [name: string];
  openFemale: [name: string];
}>();
</script>

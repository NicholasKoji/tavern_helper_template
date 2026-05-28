<template>
  <div class="detail-stack equipment-detail-main">
    <p class="equipment-detail-name">{{ name }}</p>

    <section v-for="entry in entries" :key="entry.name" class="equipment-item-card">
      <div class="equipment-visual">
        <StatusIcon :name="entry.icon" tone="neutral" />
      </div>
      <div class="equipment-copy">
        <h3>{{ entry.name }}</h3>
        <p class="equipment-status-line">
          <span>状态</span>
          <b class="equipment-status-badge" :class="`equipment-status-badge--${entry.status_tone}`">
            {{ entry.status_label }}
          </b>
        </p>
        <p class="equipment-description">{{ entry.description }}</p>
      </div>
    </section>
    <p v-if="entries.length === 0" class="empty-text">{{ name }} 当前没有装备记录。</p>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import StatusIcon from './StatusIcon.vue';

const props = defineProps<{
  name: string;
  equipment: Schema['女骑'][string]['装备'];
}>();

const entries = computed(() =>
  Object.entries(props.equipment).map(([name, item]) => {
    const status = splitStatus(item.状态);
    return {
      name,
      item,
      icon: iconFor(name),
      status_label: status.label,
      status_tone: statusToneFor(item.状态),
      description: [status.note, item.描述].filter(Boolean).join(' '),
    };
  }),
);

function iconFor(name: string) {
  if (name.includes('座椅')) {
    return 'seat';
  }
  if (name.includes('轮组')) {
    return 'wheel';
  }
  return 'suit';
}

function statusToneFor(status: string) {
  if (status.includes('正常')) {
    return 'green';
  }
  if (status.includes('卸下')) {
    return 'red';
  }
  if (status.includes('穿戴')) {
    return 'blue';
  }
  return 'neutral';
}

function splitStatus(status: string) {
  const match = status.match(/^([^，,。]+)[，,。]?\s*(.*)$/);
  return {
    label: match?.[1] || status,
    note: match?.[2] || '',
  };
}
</script>

<template>
  <div class="detail-stack">
    <section class="profile-strip red">
      <StatusIcon name="shield" tone="red" />
      <div>
        <h3>{{ name }}</h3>
        <p>{{ rider.身份 }}</p>
      </div>
    </section>
    <InfoCard>
      <dl class="inline-facts">
        <dt>年龄</dt>
        <dd>{{ rider.年龄 }}</dd>
        <dt>身份</dt>
        <dd>{{ rider.身份 }}</dd>
        <dt>所属骑士</dt>
        <dd>{{ rider.所属骑士 }}</dd>
        <dt>所属关系</dt>
        <dd>{{ rider.所属关系 }}</dd>
      </dl>
    </InfoCard>
    <div class="stat-grid">
      <InfoCard title="好感度" icon="heart" tone="red">
        <p class="large-line">{{ rider.好感度 }}</p>
        <ProgressBar :value="rider.好感度 + 100" :max="200" tone="red" />
      </InfoCard>
      <InfoCard title="体力" icon="heart" tone="red">
        <p class="large-line">{{ rider.体力 }}/100</p>
        <ProgressBar :value="rider.体力" tone="red" />
      </InfoCard>
    </div>
    <InfoCard title="态度" icon="body" tone="red"
      ><p>{{ rider.态度 }}</p></InfoCard
    >
    <InfoCard title="当前心理" icon="brain" tone="red"
      ><p>{{ rider.当前心理 }}</p></InfoCard
    >
    <InfoCard title="当前动作" icon="person" tone="red"
      ><p>{{ rider.当前动作 }}</p></InfoCard
    >
    <nav class="detail-menu">
      <button v-for="item in menu" :key="item.view" type="button" @click="$emit('open', item.view)">
        <StatusIcon :name="item.icon" tone="red" />
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.desc }}</small>
        </span>
        <b aria-hidden="true">›</b>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import InfoCard from './InfoCard.vue';
import ProgressBar from './ProgressBar.vue';
import StatusIcon from './StatusIcon.vue';

defineProps<{
  name: string;
  rider: Schema['女骑'][string];
}>();

defineEmits<{
  open: [view: 'relation' | 'appearance' | 'body' | 'equipment' | 'mobility'];
}>();

const menu = [
  { view: 'relation', label: '关系背景', desc: '查看所属关系与背景信息', icon: 'list' },
  { view: 'appearance', label: '外貌记录', desc: '查看面部与整体外貌特征', icon: 'person' },
  { view: 'body', label: '身材记录', desc: '查看身体特征与即时状态', icon: 'body' },
  { view: 'equipment', label: '装备', desc: '查看当前装备与状态', icon: 'suit' },
  { view: 'mobility', label: '机动能力', desc: '查看滑行性能详细数据', icon: 'speed' },
] as const;
</script>

<template>
  <div class="detail-stack female-detail-main">
    <p class="female-detail-name">{{ name }}</p>

    <section class="female-facts-card">
      <dl class="female-facts">
        <dt>年龄</dt>
        <dd>{{ rider.年龄 }}</dd>
        <dt>身份</dt>
        <dd>{{ rider.身份 }}</dd>
        <dt>所属骑士</dt>
        <dd>{{ rider.所属骑士 }}</dd>
        <dt>所属关系</dt>
        <dd>{{ rider.所属关系 }}</dd>
      </dl>
    </section>

    <div class="female-metric-grid">
      <section class="female-metric-card">
        <div class="female-metric-line">
          <span>好感度</span>
          <StatusIcon name="heart" tone="red" />
          <strong>{{ rider.好感度 }}</strong>
        </div>
        <ProgressBar :value="Math.max(0, rider.好感度)" tone="red" />
      </section>
      <section class="female-metric-card">
        <div class="female-metric-line">
          <span>体力</span>
          <StatusIcon name="heart" tone="red" />
          <strong>{{ rider.体力 }}<small>/100</small></strong>
        </div>
        <ProgressBar :value="rider.体力" tone="red" />
      </section>
    </div>

    <section class="female-status-card">
      <StatusIcon name="eye" tone="red" />
      <div>
        <h3>态度</h3>
        <p>{{ rider.态度 }}</p>
      </div>
    </section>
    <section class="female-status-card">
      <StatusIcon name="brain" tone="red" />
      <div>
        <h3>当前心理</h3>
        <p>{{ rider.当前心理 }}</p>
      </div>
    </section>
    <section class="female-status-card">
      <StatusIcon name="person" tone="red" />
      <div>
        <h3>当前动作</h3>
        <p>{{ rider.当前动作 }}</p>
      </div>
    </section>

    <nav class="detail-menu female-detail-menu">
      <button v-for="item in menu" :key="item.view" type="button" @click="$emit('open', item.view)">
        <StatusIcon :name="item.icon" tone="red" />
        <span>
          <strong>{{ item.label }}</strong>
          <small>{{ item.desc }}</small>
        </span>
        <b aria-hidden="true">›</b>
      </button>
    </nav>

    <button class="female-return" type="button" @click="$emit('close')">
      <span aria-hidden="true">←</span>
      返回状态卡
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import ProgressBar from './ProgressBar.vue';
import StatusIcon from './StatusIcon.vue';

defineProps<{
  name: string;
  rider: Schema['女骑'][string];
}>();

defineEmits<{
  open: [view: 'relation' | 'appearance' | 'body' | 'equipment' | 'mobility'];
  close: [];
}>();

const menu = [
  { view: 'relation', label: '关系背景', desc: '查看所属关系与背景信息', icon: 'list' },
  { view: 'appearance', label: '外貌记录', desc: '查看面部与整体外貌特征', icon: 'person' },
  { view: 'body', label: '身材记录', desc: '查看身体特征与即时状态', icon: 'body' },
  { view: 'equipment', label: '装备', desc: '查看当前装备与状态', icon: 'suit' },
  { view: 'mobility', label: '机动能力', desc: '查看滑行性能详细数据', icon: 'speed' },
] as const;
</script>

<template>
  <section class="top-card">
    <header class="brand-row">
      <StatusIcon name="shield" tone="neutral" />
      <h1>埃希斯特利亚 <span>状态卡</span></h1>
      <button class="icon-button" type="button" title="场景详情" @click="$emit('open', 'scene')">≡</button>
    </header>

    <div class="hero-grid">
      <div class="identity-block">
        <StatusIcon name="shield" tone="blue" />
        <div>
          <p class="eyebrow">主角</p>
          <h2>
            {{ data.主角.姓名 }} <small>/ {{ data.主角.年龄 }}岁</small>
          </h2>
          <p>记录者 / 当事人</p>
        </div>
      </div>
      <SanDial :value="data.主角.san值" :tone="sanTone" />
    </div>

    <div class="scene-grid">
      <div class="scene-cell">
        <StatusIcon name="clock" tone="neutral" />
        <span>当前时间</span>
        <strong>{{ padded(data.当前场景.时间.时) }}:{{ padded(data.当前场景.时间.分) }}</strong>
        <small
          >{{ data.当前场景.时间.年 }}.{{ padded(data.当前场景.时间.月) }}.{{ padded(data.当前场景.时间.日) }}</small
        >
      </div>
      <div class="scene-cell">
        <StatusIcon name="pin" tone="neutral" />
        <span>当前地点</span>
        <strong>{{ data.当前场景.地点.二级区域 }}</strong>
        <small>{{ data.当前场景.地点.一级区域 }} / {{ data.当前场景.地点.三级区域 }}</small>
      </div>
      <div class="scene-cell">
        <StatusIcon name="cloud" tone="neutral" />
        <span>天气</span>
        <strong
          >{{ data.当前场景.天气.概况 }} {{ data.当前场景.天气.气温.数值 }}{{ data.当前场景.天气.气温.单位 }}</strong
        >
        <small>{{ data.当前场景.天气.风 }}</small>
      </div>
    </div>

    <button class="todo-strip" type="button" @click="$emit('open', 'scene')">
      <StatusIcon name="list" tone="blue" />
      <span>
        <small>主要待办</small>
        {{ data.待办事项.主要 }}
      </span>
      <b aria-hidden="true">›</b>
    </button>
  </section>
</template>

<script setup lang="ts">
import type { Schema } from '../../schema';
import SanDial from './SanDial.vue';
import StatusIcon from './StatusIcon.vue';

defineProps<{
  data: Schema;
  sanTone: { className: string; label: string; color: string };
}>();

defineEmits<{
  open: [view: 'scene'];
}>();

function padded(value: number) {
  return String(value).padStart(2, '0');
}
</script>

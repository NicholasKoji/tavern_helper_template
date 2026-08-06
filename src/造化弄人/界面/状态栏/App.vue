<template>
  <div class="status-bar">
    <header class="bar-header">
      <span class="title">现实编辑器</span>
      <span class="badge">{{ data.现实编辑器.状态 }}</span>
      <span class="version">v{{ data.现实编辑器.版本 }}</span>
    </header>

    <div class="permissions">
      <span :class="['perm', data.现实编辑器.权限.修改世界规则 ? 'ok' : 'no']">
        改规则 {{ data.现实编辑器.权限.修改世界规则 ? '✓' : '✗' }}
      </span>
      <span class="perm no">改权限 ✗</span>
      <span class="perm no">卸载 ✗</span>
    </div>

    <div class="world-line">
      {{ data.世界配置.世界模板 }} · 色情 {{ data.世界配置.基调.色情浓度 }} · 搞笑
      {{ data.世界配置.基调.搞笑程度 }} · 轻松 {{ data.世界配置.基调.轻松程度 }}
    </div>
    <div class="scene">{{ data.当前场景.地点 }} · {{ data.当前场景.时间 }} · {{ data.当前场景.摘要 }}</div>

    <details v-if="ruleCount > 0" class="block">
      <summary>生效规则（{{ ruleCount }}）</summary>
      <div v-for="(group, category) in data.现实编辑器.生效规则" :key="category" class="rule-group">
        <h4>{{ category }}</h4>
        <ul>
          <li v-for="(content, name) in group" :key="name"><b>{{ name }}</b>：{{ content }}</li>
        </ul>
      </div>
    </details>

    <details v-if="glitchCount > 0" class="block">
      <summary>抽风记录（{{ glitchCount }}）</summary>
      <ul>
        <li v-for="(record, name) in data.现实编辑器.抽风记录" :key="name" class="glitch">
          <b>{{ name }}</b>（{{ record.时间 }}）：{{ record.改动 }} → {{ record.结果 }}
        </li>
      </ul>
    </details>

    <div v-if="data.现实编辑器.下次抽风提示 !== '暂无'" class="hint">{{ data.现实编辑器.下次抽风提示 }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useDataStore } from './store';

const store = useDataStore();
const { data } = storeToRefs(store);

const ruleCount = computed(() =>
  Object.values(data.value.现实编辑器.生效规则).reduce((sum, group) => sum + Object.keys(group).length, 0),
);
const glitchCount = computed(() => Object.keys(data.value.现实编辑器.抽风记录).length);
</script>

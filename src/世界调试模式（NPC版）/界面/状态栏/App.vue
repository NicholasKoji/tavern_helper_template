<template>
  <section class="debug-panel">
    <header class="panel-header">
      <div>
        <p class="eyebrow">WORLD DEBUG // NPC VIEW</p>
        <h1>世界调试模式</h1>
      </div>
      <span class="stability">{{ data.世界.规则稳定度 }}</span>
    </header>

    <div class="grid">
      <article>
        <span>时间</span>
        <strong>{{ data.世界.当前时间 }}</strong>
      </article>
      <article>
        <span>地点</span>
        <strong>{{ data.世界.当前地点 }}</strong>
      </article>
    </div>

    <p class="rule">{{ data.世界.当前规则摘要 }}</p>

    <div class="meter-list">
      <label>
        <span>认知压力</span>
        <progress :value="data.杨世发.异常认知压力" max="100" />
      </label>
      <label>
        <span>异常怀疑</span>
        <progress :value="data.杨世发.对世界异常的怀疑" max="100" />
      </label>
      <label>
        <span>社会伪装</span>
        <progress :value="data.杨世发.社会伪装程度" max="100" />
      </label>
    </div>

    <footer>
      <p>{{ data.杨世发.年龄 }}岁 · {{ data.杨世发.身份 }} · {{ data.杨世发.当前目标 }}</p>
      <small>{{ data.调试者遮蔽.叙事备注 }}</small>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { useDataStore } from './store';

const store = useDataStore();
const data = store.data;
</script>

<style scoped>
.debug-panel {
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 14px;
  border: 1px solid #2f3b45;
  background: #f4f7f2;
  color: #172026;
  font-family:
    Inter,
    'Noto Sans SC',
    system-ui,
    sans-serif;
  font-size: 13px;
  line-height: 1.45;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #b9c2b7;
}

.eyebrow {
  margin: 0 0 4px;
  color: #5f6f66;
  font-size: 11px;
  letter-spacing: 0;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.stability {
  min-width: 44px;
  height: 34px;
  display: grid;
  place-items: center;
  border: 1px solid #2f3b45;
  background: #dce6d5;
  font-weight: 700;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 10px;
}

article {
  min-width: 0;
  padding: 8px;
  border: 1px solid #c5cdc1;
  background: #ffffff;
}

article span,
label span {
  display: block;
  color: #657168;
  font-size: 12px;
}

article strong {
  display: block;
  margin-top: 2px;
  overflow-wrap: anywhere;
  font-size: 13px;
}

.rule {
  margin: 10px 0;
  padding: 9px;
  border-left: 3px solid #4f755c;
  background: #e8efe3;
}

.meter-list {
  display: grid;
  gap: 8px;
}

label {
  display: grid;
  grid-template-columns: 72px 1fr;
  align-items: center;
  gap: 8px;
}

progress {
  width: 100%;
  height: 10px;
  accent-color: #4f755c;
}

footer {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #b9c2b7;
}

footer p,
footer small {
  display: block;
  margin: 0;
  overflow-wrap: anywhere;
}

footer small {
  margin-top: 4px;
  color: #64726a;
}

@media (max-width: 520px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

<template>
  <div class="mvu-tree-node" :class="{ 'is-leaf': node.isLeaf, 'is-expanded': isExpanded }">
    <div
      class="mvu-tree-row"
      :class="{
        'is-selected': isChecked,
      }"
      :style="{ paddingLeft: `${depth * 18 + 8}px` }"
      @click="handleRowClick"
    >
      <!-- 折叠/展开图标 -->
      <button
        v-if="!node.isLeaf"
        type="button"
        class="mvu-tree-expand-btn"
        :title="isExpanded ? '折叠' : '展开'"
        @click.stop="toggleExpand"
      >
        <i class="fa-solid" :class="isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'"></i>
      </button>
      <span v-else class="mvu-tree-expand-placeholder"></span>

      <!-- 独立可靠的复选框 (支持 FontAwesome 对勾，不受浏览器样式与主题差异干扰) -->
      <div
        class="mvu-tree-checkbox"
        :class="{ 'is-checked': isChecked }"
        role="checkbox"
        :aria-checked="isChecked"
        :title="isChecked ? '点击取消勾选' : '点击勾选'"
        @click.stop="handleCheckboxClick"
      >
        <i v-if="isChecked" class="fa-solid fa-check"></i>
      </div>

      <!-- 节点图标 -->
      <span class="mvu-tree-icon">
        <i
          class="fa-solid"
          :class="node.isLeaf ? 'fa-tag' : isExpanded ? 'fa-folder-open' : 'fa-folder'"
        ></i>
      </span>

      <!-- 节点名称 -->
      <span class="mvu-tree-label" :title="node.path">
        {{ node.key }}
      </span>

      <!-- 值预览或子项计数 -->
      <span v-if="node.valueText" class="mvu-tree-badge" :class="{ 'is-val': node.isLeaf }">
        {{ node.valueText }}
      </span>
    </div>

    <!-- 子节点渲染 -->
    <div v-if="!node.isLeaf && isExpanded && node.children && node.children.length > 0" class="mvu-tree-children">
      <MvuTreeNodeItem
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-paths="selectedPaths"
        :collapsed-paths="collapsedPaths"
        @toggle-select="$emit('toggleSelect', $event)"
        @toggle-collapse="$emit('toggleCollapse', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { MvuTreeNode } from './types';

const props = withDefaults(
  defineProps<{
    node: MvuTreeNode;
    depth?: number;
    selectedPaths: Set<string>;
    collapsedPaths: Set<string>;
  }>(),
  {
    depth: 0,
  },
);

const emit = defineEmits<{
  (e: 'toggleSelect', payload: { path: string; node: MvuTreeNode; select: boolean }): void;
  (e: 'toggleCollapse', path: string): void;
}>();

const isExpanded = computed(() => !props.collapsedPaths.has(props.node.path));

// 统计当前节点下的所有叶子节点总数与已被选中的叶子数
const leafStats = computed(() => {
  if (props.node.isLeaf) {
    const isSel = props.selectedPaths.has(props.node.path);
    return { total: 1, selected: isSel ? 1 : 0 };
  }
  let total = 0;
  let selected = 0;
  const count = (n: MvuTreeNode) => {
    if (n.isLeaf) {
      total++;
      if (props.selectedPaths.has(n.path)) {
        selected++;
      }
    } else if (n.children) {
      for (const c of n.children) {
        count(c);
      }
    }
  };
  count(props.node);
  return { total, selected };
});

// 勾选状态：“有任意子元素勾选了，那父元素也要勾选上”
const isChecked = computed(() => {
  if (props.node.isLeaf) {
    return props.selectedPaths.has(props.node.path);
  }
  return leafStats.value.selected > 0;
});

function toggleExpand() {
  emit('toggleCollapse', props.node.path);
}

function handleRowClick() {
  if (props.node.isLeaf) {
    emit('toggleSelect', {
      path: props.node.path,
      node: props.node,
      select: !isChecked.value,
    });
  } else {
    toggleExpand();
  }
}

function handleCheckboxClick() {
  // 点击复选框：若已处于勾选状态，则反选为全消；若未勾选，则全选
  const targetSelect = !isChecked.value;
  emit('toggleSelect', {
    path: props.node.path,
    node: props.node,
    select: targetSelect,
  });
}
</script>

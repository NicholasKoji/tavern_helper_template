<template>
  <main class="status-shell" :class="san_tone.className">
    <TopSummary :data="store.data" :san-tone="san_tone" @open="openDrawer" />

    <section class="status-body">
      <PersonList
        :knights="knights"
        :female-riders="female_riders"
        @open-knight="name => openDrawer('knight', name)"
        @open-female="name => openDrawer('female', name)"
      />
      <button class="wide-action" type="button" @click="openDrawer('scene')">
        查看当前场景与待办
        <span aria-hidden="true">›</span>
      </button>
    </section>

    <DetailDrawer v-if="drawer_view" :title="drawer_title" :tone="drawer_tone" @close="closeDrawer">
      <SceneTodoDetail v-if="drawer_view === 'scene'" :scene="store.data.当前场景" :todos="store.data.待办事项" />
      <KnightDetail
        v-else-if="drawer_view === 'knight' && selected_knight"
        :name="selected_name"
        :knight="selected_knight"
      />
      <FemaleDetail
        v-else-if="drawer_view === 'female' && selected_female"
        :name="selected_name"
        :rider="selected_female"
        @close="closeDrawer"
        @open="openFemaleSubView"
      />
      <RelationDetail
        v-else-if="drawer_view === 'relation' && selected_female"
        :name="selected_name"
        :rider="selected_female"
      />
      <AppearanceDetail
        v-else-if="drawer_view === 'appearance' && selected_female"
        :name="selected_name"
        :appearance="selected_female.外貌"
      />
      <BodyDetail
        v-else-if="drawer_view === 'body' && selected_female"
        :name="selected_name"
        :body="selected_female.身材"
      />
      <EquipmentDetail
        v-else-if="drawer_view === 'equipment' && selected_female"
        :name="selected_name"
        :equipment="selected_female.装备"
      />
      <MobilityDetail
        v-else-if="drawer_view === 'mobility' && selected_female"
        :name="selected_name"
        :rider="selected_female"
      />
      <button v-if="is_female_subview" class="drawer-back" type="button" @click="openDrawer('female', selected_name)">
        ← 返回女骑详情
      </button>
    </DetailDrawer>
  </main>
</template>

<script setup lang="ts">
import AppearanceDetail from './components/AppearanceDetail.vue';
import BodyDetail from './components/BodyDetail.vue';
import DetailDrawer from './components/DetailDrawer.vue';
import EquipmentDetail from './components/EquipmentDetail.vue';
import FemaleDetail from './components/FemaleDetail.vue';
import KnightDetail from './components/KnightDetail.vue';
import MobilityDetail from './components/MobilityDetail.vue';
import PersonList from './components/PersonList.vue';
import RelationDetail from './components/RelationDetail.vue';
import SceneTodoDetail from './components/SceneTodoDetail.vue';
import TopSummary from './components/TopSummary.vue';
import { useDataStore } from './store';

type DrawerView = 'scene' | 'knight' | 'female' | 'relation' | 'appearance' | 'body' | 'equipment' | 'mobility' | null;

const store = useDataStore();
const drawer_view = ref<DrawerView>(null);
const selected_name = ref('');

const knights = computed(() => Object.entries(store.data.骑士));
const female_riders = computed(() => Object.entries(store.data.女骑));
const selected_knight = computed(() => (selected_name.value ? store.data.骑士[selected_name.value] : undefined));
const selected_female = computed(() => (selected_name.value ? store.data.女骑[selected_name.value] : undefined));
const is_female_subview = computed(() =>
  ['relation', 'appearance', 'body', 'equipment', 'mobility'].includes(drawer_view.value ?? ''),
);

const san_tone = computed(() => {
  const san = store.data.主角.san值;
  if (san >= 70) {
    return { className: 'tone-calm', label: '稳定', color: 'blue' };
  }
  if (san >= 30) {
    return { className: 'tone-warn', label: '警戒', color: 'amber' };
  }
  return { className: 'tone-danger', label: '危险', color: 'red' };
});

const drawer_title = computed(() => {
  if (drawer_view.value === 'scene') {
    return '当前场景';
  }
  if (drawer_view.value === 'knight') {
    return '骑士详情';
  }
  if (drawer_view.value === 'female') {
    return '女骑详情';
  }
  const title_map: Record<string, string> = {
    relation: '关系背景',
    appearance: '外貌记录',
    body: '身材记录',
    equipment: '装备',
    mobility: '机动能力',
  };
  return drawer_view.value ? title_map[drawer_view.value] : '';
});

const drawer_tone = computed(() => (drawer_view.value === 'knight' || drawer_view.value === 'scene' ? 'blue' : 'red'));

function openDrawer(view: Exclude<DrawerView, null>, name = '') {
  drawer_view.value = view;
  selected_name.value = name;
  resetDrawerScroll();
}

function openFemaleSubView(view: Exclude<DrawerView, null>) {
  drawer_view.value = view;
  resetDrawerScroll();
}

function closeDrawer() {
  drawer_view.value = null;
}

function resetDrawerScroll() {
  nextTick(() => {
    const drawer = document.querySelector<HTMLElement>('.detail-drawer');
    if (drawer) {
      drawer.scrollTop = 0;
    }
  });
}
</script>

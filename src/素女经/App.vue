<template>
  <div class="position-tool" @keydown.esc="close">
    <button class="backdrop" type="button" aria-label="关闭素女经" @click="close"></button>

    <section
      class="workspace"
      :class="{ 'detail-mode': mobileDetailOpen }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="position-tool-title"
      tabindex="-1"
    >
      <header class="topbar">
        <div class="title-block">
          <span class="eyebrow">SU NV JING · 01</span>
          <div class="title-line">
            <h1 id="position-tool-title">素女经</h1>
            <span class="catalog-count">{{ positions.length }} 种</span>
          </div>
          <p>先挑身体布局，再把可编辑的动作提示插入酒馆输入框。</p>
        </div>

        <div class="top-actions">
          <button class="quiet-button" type="button" @click="pickRandom">
            <span aria-hidden="true">↝</span>
            随机抽取
          </button>
          <button class="icon-button" type="button" aria-label="关闭" @click="close">×</button>
        </div>
      </header>

      <div class="filter-rail" aria-label="筛选体位">
        <label class="search-box">
          <span class="search-icon" aria-hidden="true"></span>
          <input v-model.trim="query" type="search" placeholder="搜索中文名、英文名或动作描述" />
          <button v-if="query" type="button" aria-label="清除搜索" @click="query = ''">×</button>
        </label>

        <label class="select-control">
          <span>分类</span>
          <select v-model="categoryFilter">
            <option value="全部">全部分类</option>
            <option v-for="option in categoryOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="select-control">
          <span>方式</span>
          <select v-model="activityFilter">
            <option value="全部">全部方式</option>
            <option v-for="activity in activityOptions" :key="activity" :value="activity">{{ activity }}</option>
          </select>
        </label>

        <label class="select-control compact-control">
          <span>难度</span>
          <select v-model="difficultyFilter">
            <option value="全部">不限</option>
            <option value="入门">入门</option>
            <option value="中等">中等</option>
            <option value="进阶">进阶</option>
          </select>
        </label>

        <button
          class="favorite-filter"
          :class="{ active: favoritesOnly }"
          type="button"
          :aria-pressed="favoritesOnly"
          @click="favoritesOnly = !favoritesOnly"
        >
          <span aria-hidden="true">♥</span>
          只看收藏
        </button>
      </div>

      <div class="content-grid" :class="{ 'mobile-detail-open': mobileDetailOpen }">
        <main class="catalog-pane">
          <div class="catalog-summary">
            <p>
              <strong>{{ filteredPositions.length }}</strong>
              个结果
              <span v-if="activeFilterCount">· 已启用 {{ activeFilterCount }} 项筛选</span>
            </p>
            <button v-if="activeFilterCount" type="button" @click="resetFilters">重置筛选</button>
          </div>

          <div v-if="filteredPositions.length" class="position-grid">
            <article
              v-for="position in filteredPositions"
              :key="position.id"
              class="position-card"
              :class="{ selected: selected?.id === position.id }"
            >
              <button class="card-select" type="button" @click="selectPosition(position, true)">
                <div class="card-image-wrap">
                  <img
                    v-if="imagesVisible && position.imageUrl && !failedImages.has(position.id)"
                    :src="position.imageUrl"
                    :alt="`${position.titleZh}示意图`"
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    @error="markImageFailed(position.id)"
                  />
                  <div v-else class="image-placeholder" aria-hidden="true">
                    <span>{{ String(position.index).padStart(3, '0') }}</span>
                    <small>{{ position.categoryZh }}</small>
                  </div>
                  <span class="index-mark">{{ String(position.index).padStart(3, '0') }}</span>
                </div>

                <div class="card-copy">
                  <div class="card-meta">
                    <span>{{ position.categoryZh }}</span>
                    <span>{{ position.difficulty }}</span>
                  </div>
                  <h2>{{ position.titleZh }}</h2>
                  <p>{{ shortEnglishTitle(position.titleEn) }}</p>
                  <div class="activity-tags">
                    <span v-for="activity in position.activities.slice(0, 2)" :key="activity">{{ activity }}</span>
                  </div>
                </div>
              </button>

              <button
                class="favorite-button"
                :class="{ active: favoriteIds.has(position.id) }"
                type="button"
                :aria-label="favoriteIds.has(position.id) ? `取消收藏${position.titleZh}` : `收藏${position.titleZh}`"
                :aria-pressed="favoriteIds.has(position.id)"
                @click="toggleFavorite(position.id)"
              >
                {{ favoriteIds.has(position.id) ? '♥' : '♡' }}
              </button>
            </article>
          </div>

          <div v-else class="empty-state">
            <span aria-hidden="true">∅</span>
            <h2>没有符合条件的体位</h2>
            <p>换个关键词或清除部分筛选条件。</p>
            <button type="button" @click="resetFilters">显示全部 161 种</button>
          </div>
        </main>

        <aside class="detail-pane" aria-label="体位详情与提示词">
          <div v-if="selected" class="detail-content">
            <div class="mobile-detail-header">
              <button type="button" @click="mobileDetailOpen = false">← 返回列表</button>
              <span>{{ String(selected.index).padStart(3, '0') }} / {{ positions.length }}</span>
            </div>

            <div class="hero-image">
              <img
                v-if="imagesVisible && selected.imageUrl && !failedImages.has(selected.id)"
                :src="selected.imageUrl"
                :alt="`${selected.titleZh}动作示意`"
                referrerpolicy="no-referrer"
                @error="markImageFailed(selected.id)"
              />
              <div v-else class="hero-placeholder">
                <span>{{ String(selected.index).padStart(3, '0') }}</span>
                <p>{{ selected.categoryZh }} · {{ selected.difficulty }}</p>
              </div>
              <button class="image-toggle" type="button" @click="toggleImages">
                {{ imagesVisible ? '隐藏图片' : '显示图片' }}
              </button>
            </div>

            <div class="detail-heading">
              <div>
                <span class="eyebrow">POSITION {{ String(selected.index).padStart(3, '0') }}</span>
                <h2>{{ selected.titleZh }}</h2>
                <p class="english-name">{{ selected.titleEn }}</p>
              </div>
              <button
                class="detail-favorite"
                :class="{ active: favoriteIds.has(selected.id) }"
                type="button"
                :aria-pressed="favoriteIds.has(selected.id)"
                @click="toggleFavorite(selected.id)"
              >
                {{ favoriteIds.has(selected.id) ? '♥ 已收藏' : '♡ 收藏' }}
              </button>
            </div>

            <div class="facts-line">
              <span>{{ selected.categoryZh }}</span>
              <span>{{ selected.difficulty }}</span>
              <span v-for="activity in selected.activities" :key="activity">{{ activity }}</span>
            </div>

            <section class="layout-note">
              <div class="section-label">
                <span>身体布局</span>
                <a :href="selected.sourceUrl" target="_blank" rel="noreferrer">查看英文原页 ↗</a>
              </div>
              <p>{{ selected.layoutZh }}</p>
            </section>

            <section class="modifier-section">
              <div class="section-label">
                <span>附加玩法</span>
                <small>可多选，不受原图限制</small>
              </div>
              <div class="modifier-list">
                <button
                  v-for="modifier in modifiers"
                  :key="modifier"
                  type="button"
                  :class="{ active: selectedModifiers.includes(modifier) }"
                  :aria-pressed="selectedModifiers.includes(modifier)"
                  @click="toggleModifier(modifier)"
                >
                  {{ modifier }}
                </button>
              </div>
            </section>

            <section class="prompt-section">
              <div class="section-label">
                <span>可编辑动作提示 · JSON</span>
                <button type="button" @click="regeneratePrompt">恢复推荐文案</button>
              </div>
              <textarea v-model="promptText" rows="14" spellcheck="false" @input="promptTouched = true"></textarea>
              <div class="prompt-actions">
                <button class="secondary-action" type="button" @click="copyPrompt">{{ copyLabel }}</button>
                <button class="primary-action" type="button" @click="insertPrompt">插入酒馆输入框</button>
              </div>
              <p class="write-note">插入只修改输入框，不会自动发送消息。</p>
            </section>
          </div>

          <div v-else class="detail-empty">
            <span>01</span>
            <h2>选择一个身体布局</h2>
            <p>右侧会生成中文动作摘要和可编辑的 RP 提示。</p>
          </div>
        </aside>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import rawPositions from './positions.json';

type Difficulty = '入门' | '中等' | '进阶';

type Position = {
  index: number;
  id: string;
  titleZh: string;
  titleEn: string;
  category: string;
  categoryZh: string;
  activities: string[];
  difficulty: Difficulty;
  layoutZh: string;
  layoutEn: string;
  bestForZh: string;
  imageUrl: string;
  sourceUrl: string;
  promptSpec: {
    English_name: string;
    Japanese_name: string;
    role_map: Record<string, string>;
    basics: {
      body_layout: string;
      core_action: string;
    };
    options: string[];
  };
};

const props = defineProps<{
  initialFavorites: string[];
  initialImagesVisible: boolean;
  onClose: () => void;
  onSavePreferences: (preferences: { favorites: string[]; imagesVisible: boolean }) => void;
  onInsertPrompt: (prompt: string) => void;
}>();

const positions = rawPositions as Position[];
const query = ref('');
const categoryFilter = ref('全部');
const activityFilter = ref('全部');
const difficultyFilter = ref('全部');
const favoritesOnly = ref(false);
const favoriteIds = ref(new Set(props.initialFavorites));
const imagesVisible = ref(props.initialImagesVisible);
const failedImages = ref(new Set<string>());
const selected = ref<Position | null>(positions.find(position => position.id === 'classic') ?? positions[0] ?? null);
const selectedModifiers = ref<string[]>([]);
const promptText = ref('');
const promptTouched = ref(false);
const mobileDetailOpen = ref(false);
const copyLabel = ref('复制文案');
let copyTimer: ReturnType<typeof setTimeout> | undefined;

const modifiers = ['阴道性交', '肛交', '口交', '乳交', '手交／指交', '足交', '股交／摩擦', '多人配合'];

const modifierActions: Record<string, string> = {
  阴道性交:
    "The penetrating partner aligns the penis or strap-on with the receiving partner's vagina, enters from the angle established by the body layout, and coordinates thrust depth with the receiver's pelvic movement.",
  肛交: "The penetrating partner aligns the penis or strap-on with the receiving partner's anus, begins with short controlled entry, and increases depth only while both bodies keep the stated support points.",
  口交: "One partner aligns their mouth with the other partner's genitals and combines tongue movement with controlled head movement while a free hand stabilizes the hips or adds stimulation.",
  乳交: 'The stimulating partner presses both breasts around the penis and moves the chest vertically while the penis owner keeps the shaft aligned between the breasts with one hand.',
  '手交／指交':
    'The stimulating partner uses one or both hands in a steady stroking, in-and-out, or curling motion while the receiving partner changes pelvic angle to maintain contact.',
  足交: 'The stimulating partner places one or both feet around the penis and moves them together along the shaft while the penis owner supports the ankles and keeps the pelvis aligned.',
  '股交／摩擦':
    "The partners press the penis, vulva, or external genitals between the thighs or against the partner's body and create friction through synchronized pelvic rocking without changing the main layout.",
  多人配合:
    'The additional adult partner takes the open front, rear, or side position, establishes a separate contact point, and changes rhythm only after the other participants are stable.',
};

const categoryOptions = computed(() => {
  const seen = new Map<string, string>();
  positions.forEach(position => seen.set(position.category, position.categoryZh));
  return [...seen.entries()].map(([value, label]) => ({ value, label }));
});

const activityOptions = computed(() => {
  return [...new Set(positions.flatMap(position => position.activities))].sort((a, b) => a.localeCompare(b, 'zh-CN'));
});

const filteredPositions = computed(() => {
  const needle = query.value.toLocaleLowerCase();
  return positions.filter(position => {
    if (categoryFilter.value !== '全部' && position.category !== categoryFilter.value) return false;
    if (activityFilter.value !== '全部' && !position.activities.includes(activityFilter.value)) return false;
    if (difficultyFilter.value !== '全部' && position.difficulty !== difficultyFilter.value) return false;
    if (favoritesOnly.value && !favoriteIds.value.has(position.id)) return false;
    if (!needle) return true;
    const haystack = [
      position.titleZh,
      position.titleEn,
      position.layoutZh,
      position.categoryZh,
      ...position.activities,
    ]
      .join(' ')
      .toLocaleLowerCase();
    return haystack.includes(needle);
  });
});

const activeFilterCount = computed(() => {
  return [
    Boolean(query.value),
    categoryFilter.value !== '全部',
    activityFilter.value !== '全部',
    difficultyFilter.value !== '全部',
    favoritesOnly.value,
  ].filter(Boolean).length;
});

function shortEnglishTitle(title: string): string {
  return title
    .split(':')[0]
    .replace(/\s+Sex Position$/i, '')
    .replace(/\s+Position$/i, '');
}

function buildPrompt(position: Position): string {
  const options = [
    ...position.promptSpec.options,
    ...selectedModifiers.value.map(modifier => modifierActions[modifier]).filter(Boolean),
  ];
  return JSON.stringify(
    {
      type: 'sex position',
      Chinese_name: position.titleZh,
      English_name: position.promptSpec.English_name,
      Japanese_name: position.promptSpec.Japanese_name,
      basics: {
        ...position.promptSpec.role_map,
        body_layout: position.promptSpec.basics.body_layout,
        core_action: position.promptSpec.basics.core_action,
      },
      options,
    },
    null,
    2,
  );
}

function selectPosition(position: Position, showMobileDetail = false): void {
  selected.value = position;
  selectedModifiers.value = [];
  promptTouched.value = false;
  promptText.value = buildPrompt(position);
  if (showMobileDetail) mobileDetailOpen.value = true;
}

function pickRandom(): void {
  const pool = filteredPositions.value.length ? filteredPositions.value : positions;
  const next = pool[Math.floor(Math.random() * pool.length)];
  if (next) selectPosition(next, true);
}

function toggleFavorite(id: string): void {
  const next = new Set(favoriteIds.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  favoriteIds.value = next;
  savePreferences();
}

function toggleImages(): void {
  imagesVisible.value = !imagesVisible.value;
  savePreferences();
}

function savePreferences(): void {
  props.onSavePreferences({ favorites: [...favoriteIds.value], imagesVisible: imagesVisible.value });
}

function markImageFailed(id: string): void {
  const next = new Set(failedImages.value);
  next.add(id);
  failedImages.value = next;
}

function toggleModifier(modifier: string): void {
  const next = new Set(selectedModifiers.value);
  if (next.has(modifier)) next.delete(modifier);
  else next.add(modifier);
  selectedModifiers.value = [...next];
  if (!promptTouched.value && selected.value) promptText.value = buildPrompt(selected.value);
}

function regeneratePrompt(): void {
  if (!selected.value) return;
  promptTouched.value = false;
  promptText.value = buildPrompt(selected.value);
}

async function copyPrompt(): Promise<void> {
  if (!promptText.value.trim()) return;
  try {
    await navigator.clipboard.writeText(promptText.value);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = promptText.value;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  copyLabel.value = '已复制';
  if (copyTimer) clearTimeout(copyTimer);
  copyTimer = setTimeout(() => (copyLabel.value = '复制文案'), 1400);
}

function insertPrompt(): void {
  if (!promptText.value.trim()) return;
  props.onInsertPrompt(promptText.value.trim());
}

function resetFilters(): void {
  query.value = '';
  categoryFilter.value = '全部';
  activityFilter.value = '全部';
  difficultyFilter.value = '全部';
  favoritesOnly.value = false;
}

function close(): void {
  mobileDetailOpen.value = false;
  props.onClose();
}

watch(selected, position => {
  if (position && !promptText.value) promptText.value = buildPrompt(position);
});

onMounted(() => {
  if (selected.value) promptText.value = buildPrompt(selected.value);
});

onBeforeUnmount(() => {
  if (copyTimer) clearTimeout(copyTimer);
});
</script>

<style scoped>
:global(*) {
  box-sizing: border-box;
}

:global(html),
:global(body),
:global(#app) {
  width: 100%;
  height: 100%;
  margin: 0;
}

:global(button),
:global(input),
:global(select),
:global(textarea) {
  font: inherit;
}

.position-tool {
  --ink: #f4eee9;
  --muted: #b8aaa8;
  --faint: #827574;
  --surface: #171315;
  --surface-raised: #211a1d;
  --surface-soft: #2a2124;
  --line: #423437;
  --accent: #e05f72;
  --accent-bright: #ff8392;
  --paper: #e8d9ca;
  position: fixed;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  color: var(--ink);
  font-family:
    Inter,
    'PingFang SC',
    'Microsoft YaHei UI',
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 14px;
  line-height: 1.5;
}

.backdrop {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  background: rgb(5 3 4 / 82%);
}

.workspace {
  position: relative;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: min(1240px, calc(100% - 32px));
  height: min(860px, calc(100% - 32px));
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  box-shadow: 0 30px 90px rgb(0 0 0 / 55%);
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px 17px;
  border-bottom: 1px solid var(--line);
}

.title-block,
.detail-heading > div {
  min-width: 0;
}

.eyebrow {
  display: block;
  margin-bottom: 4px;
  color: var(--accent-bright);
  font-family: 'Cascadia Code', 'SFMono-Regular', Consolas, monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.title-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.title-line h1,
.detail-heading h2 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', 'Songti SC', serif;
  font-size: 28px;
  font-weight: 650;
  line-height: 1.15;
}

.catalog-count {
  color: var(--paper);
  font-size: 13px;
  font-weight: 700;
}

.title-block > p {
  margin: 5px 0 0;
  color: var(--muted);
}

.top-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

button {
  color: inherit;
}

.quiet-button,
.icon-button,
.favorite-filter,
.detail-favorite,
.image-toggle,
.secondary-action,
.primary-action,
.catalog-summary button,
.section-label button,
.mobile-detail-header button,
.empty-state button {
  min-height: 38px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition:
    border-color 150ms ease,
    background 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.quiet-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  color: var(--paper);
}

.quiet-button span {
  color: var(--accent-bright);
  font-size: 20px;
}

.quiet-button:hover,
.secondary-action:hover,
.catalog-summary button:hover,
.section-label button:hover,
.mobile-detail-header button:hover,
.empty-state button:hover {
  border-color: #76545b;
  background: var(--surface-soft);
}

.icon-button {
  width: 40px;
  padding: 0;
  color: var(--muted);
  font-size: 24px;
}

.icon-button:hover {
  color: var(--ink);
  border-color: #76545b;
}

.filter-rail {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 150px 150px 118px auto;
  gap: 10px;
  padding: 12px 24px;
  border-bottom: 1px solid var(--line);
  background: #1b1618;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.search-box input,
.select-control select,
.prompt-section textarea {
  width: 100%;
  border: 1px solid var(--line);
  color: var(--ink);
  background: #110e0f;
  outline: none;
}

.search-box input {
  height: 42px;
  padding: 0 38px 0 40px;
  border-radius: 8px;
}

.search-box input:focus,
.select-control select:focus,
.prompt-section textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 2px rgb(224 95 114 / 16%);
}

.search-icon {
  position: absolute;
  left: 14px;
  width: 13px;
  height: 13px;
  border: 1.5px solid var(--muted);
  border-radius: 50%;
  pointer-events: none;
}

.search-icon::after {
  position: absolute;
  right: -5px;
  bottom: -3px;
  width: 6px;
  height: 1.5px;
  background: var(--muted);
  content: '';
  transform: rotate(45deg);
}

.search-box button {
  position: absolute;
  right: 5px;
  width: 32px;
  height: 32px;
  border: 0;
  color: var(--faint);
  background: transparent;
  cursor: pointer;
}

.select-control {
  position: relative;
  min-width: 0;
}

.select-control > span {
  position: absolute;
  z-index: 1;
  top: 5px;
  left: 11px;
  color: var(--faint);
  font-size: 10px;
  letter-spacing: 0.08em;
  pointer-events: none;
}

.select-control select {
  height: 42px;
  padding: 15px 28px 2px 10px;
  border-radius: 8px;
  font-size: 13px;
}

.favorite-filter {
  padding: 0 13px;
  color: var(--muted);
  white-space: nowrap;
}

.favorite-filter span,
.detail-favorite.active,
.favorite-button.active {
  color: var(--accent-bright);
}

.favorite-filter.active {
  border-color: #86515b;
  color: var(--ink);
  background: #332126;
}

.content-grid {
  display: grid;
  grid-template-columns: minmax(0, 58%) minmax(360px, 42%);
  min-height: 0;
}

.catalog-pane,
.detail-pane {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
}

.catalog-pane {
  padding: 18px 20px 28px 24px;
}

.detail-pane {
  border-left: 1px solid var(--line);
  background: #120f10;
}

.catalog-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 31px;
  margin-bottom: 12px;
  color: var(--muted);
  font-size: 13px;
}

.catalog-summary p {
  margin: 0;
}

.catalog-summary strong {
  color: var(--ink);
  font-size: 18px;
}

.catalog-summary button,
.section-label button {
  min-height: 30px;
  padding: 0 10px;
  color: var(--muted);
  font-size: 12px;
}

.position-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.position-card {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: var(--surface-raised);
  transition:
    border-color 160ms ease,
    transform 160ms ease,
    box-shadow 160ms ease;
}

.position-card:hover {
  border-color: #74535a;
  transform: translateY(-2px);
}

.position-card.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px rgb(224 95 114 / 28%);
}

.card-select {
  display: block;
  width: 100%;
  padding: 0;
  border: 0;
  text-align: left;
  background: transparent;
  cursor: pointer;
}

.card-image-wrap {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #0b090a;
}

.card-image-wrap img,
.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-image-wrap img {
  opacity: 0.87;
  transition:
    opacity 180ms ease,
    transform 240ms ease;
}

.position-card:hover .card-image-wrap img {
  opacity: 1;
  transform: scale(1.025);
}

.image-placeholder,
.hero-placeholder {
  display: grid;
  height: 100%;
  place-content: center;
  text-align: center;
  background: #191416;
}

.image-placeholder span,
.hero-placeholder span {
  color: var(--paper);
  font-family: Georgia, serif;
  font-size: 29px;
}

.image-placeholder small,
.hero-placeholder p {
  margin: 2px 0 0;
  color: var(--faint);
  font-size: 11px;
  letter-spacing: 0.12em;
}

.index-mark {
  position: absolute;
  right: 8px;
  bottom: 7px;
  padding: 2px 6px;
  border: 1px solid rgb(255 255 255 / 16%);
  border-radius: 4px;
  color: white;
  background: rgb(8 5 6 / 72%);
  font-family: 'Cascadia Code', monospace;
  font-size: 10px;
}

.card-copy {
  padding: 11px 12px 13px;
}

.card-meta {
  display: flex;
  gap: 9px;
  margin-bottom: 3px;
  color: var(--accent-bright);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.card-copy h2 {
  overflow: hidden;
  margin: 0;
  color: var(--ink);
  font-size: 16px;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-copy > p {
  overflow: hidden;
  margin: 2px 28px 8px 0;
  color: var(--faint);
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-tags,
.facts-line,
.modifier-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.activity-tags span,
.facts-line span {
  padding: 2px 7px;
  border: 1px solid #493a3d;
  border-radius: 5px;
  color: var(--muted);
  font-size: 11px;
}

.favorite-button {
  position: absolute;
  right: 8px;
  bottom: 42px;
  z-index: 2;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  font-size: 20px;
}

.empty-state,
.detail-empty {
  display: grid;
  min-height: 360px;
  place-content: center;
  padding: 30px;
  text-align: center;
}

.empty-state > span,
.detail-empty > span {
  color: #5f4b50;
  font-family: Georgia, serif;
  font-size: 54px;
}

.empty-state h2,
.detail-empty h2 {
  margin: 6px 0 4px;
  font-family: Georgia, serif;
  font-size: 21px;
}

.empty-state p,
.detail-empty p {
  margin: 0 0 15px;
  color: var(--muted);
}

.empty-state button {
  justify-self: center;
  padding: 0 14px;
}

.detail-content {
  padding-bottom: 30px;
}

.mobile-detail-header {
  display: none;
}

.hero-image {
  position: relative;
  height: clamp(210px, 31vh, 310px);
  overflow: hidden;
  border-bottom: 1px solid var(--line);
  background: #090708;
}

.image-toggle {
  position: absolute;
  z-index: 1;
  right: 12px;
  bottom: 12px;
  min-height: 31px;
  padding: 0 10px;
  color: var(--paper);
  background: rgb(12 9 10 / 78%);
  font-size: 11px;
}

.detail-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 19px 22px 12px;
}

.detail-heading h2 {
  font-size: 26px;
}

.english-name {
  margin: 4px 0 0;
  color: var(--faint);
  font-size: 12px;
}

.detail-favorite {
  flex: 0 0 auto;
  min-height: 34px;
  padding: 0 10px;
  color: var(--muted);
  font-size: 12px;
}

.facts-line {
  padding: 0 22px 16px;
}

.facts-line span:first-child {
  color: var(--accent-bright);
  border-color: #70464e;
}

.layout-note,
.modifier-section,
.prompt-section {
  margin: 0 22px;
  padding: 15px 0;
  border-top: 1px solid var(--line);
}

.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 9px;
}

.section-label > span {
  color: var(--paper);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.section-label a,
.section-label small {
  color: var(--faint);
  font-size: 11px;
  text-decoration: none;
}

.section-label a:hover {
  color: var(--accent-bright);
}

.layout-note > p {
  margin: 0;
  color: #d4c7c4;
  line-height: 1.7;
}

.modifier-list button {
  min-height: 32px;
  padding: 0 10px;
  border: 1px solid #493a3d;
  border-radius: 6px;
  color: var(--muted);
  background: transparent;
  cursor: pointer;
  font-size: 12px;
}

.modifier-list button:hover {
  color: var(--ink);
  border-color: #74535a;
}

.modifier-list button.active {
  color: #ffe4e7;
  border-color: #9a5260;
  background: #40242a;
}

.prompt-section textarea {
  min-height: 168px;
  padding: 12px;
  resize: vertical;
  border-radius: 8px;
  line-height: 1.65;
}

.prompt-actions {
  display: grid;
  grid-template-columns: minmax(110px, 0.55fr) minmax(180px, 1fr);
  gap: 8px;
  margin-top: 10px;
}

.secondary-action,
.primary-action {
  padding: 0 15px;
}

.primary-action {
  border-color: var(--accent);
  color: #fff;
  background: var(--accent);
  font-weight: 750;
}

.primary-action:hover {
  border-color: var(--accent-bright);
  background: var(--accent-bright);
  transform: translateY(-1px);
}

.write-note {
  margin: 7px 0 0;
  color: var(--faint);
  font-size: 11px;
  text-align: right;
}

@media (max-width: 980px) {
  .filter-rail {
    grid-template-columns: minmax(220px, 1fr) repeat(3, minmax(110px, 0.45fr));
  }

  .favorite-filter {
    grid-column: 1 / -1;
    justify-self: start;
  }

  .content-grid {
    grid-template-columns: minmax(0, 54%) minmax(330px, 46%);
  }

  .position-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .position-tool {
    place-items: stretch;
  }

  .workspace {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: 0;
  }

  .workspace.detail-mode .topbar,
  .workspace.detail-mode .filter-rail {
    display: none;
  }

  .topbar {
    align-items: center;
    padding: 14px 14px 12px;
  }

  .title-line h1 {
    font-size: 23px;
  }

  .title-block > p,
  .quiet-button {
    display: none;
  }

  .filter-rail {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    padding: 10px 12px;
    overflow-x: hidden;
  }

  .search-box {
    grid-column: 1 / -1;
  }

  .compact-control {
    min-width: 0;
  }

  .favorite-filter {
    grid-column: 1 / -1;
    justify-self: stretch;
    min-height: 36px;
  }

  .content-grid {
    display: block;
    overflow: hidden;
  }

  .catalog-pane,
  .detail-pane {
    width: 100%;
    height: 100%;
  }

  .catalog-pane {
    padding: 14px 12px 24px;
  }

  .detail-pane {
    display: none;
    border-left: 0;
  }

  .content-grid.mobile-detail-open .catalog-pane {
    display: none;
  }

  .content-grid.mobile-detail-open .detail-pane {
    display: block;
  }

  .position-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 9px;
  }

  .card-copy {
    padding: 9px 9px 11px;
  }

  .card-copy h2 {
    font-size: 14px;
  }

  .card-copy > p {
    font-size: 10px;
  }

  .favorite-button {
    right: 4px;
    bottom: 36px;
  }

  .mobile-detail-header {
    position: sticky;
    z-index: 3;
    top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 44px;
    padding: 0 12px;
    border-bottom: 1px solid var(--line);
    color: var(--muted);
    background: #120f10;
    font-size: 12px;
  }

  .mobile-detail-header button {
    min-height: 32px;
    padding: 0 10px;
  }

  .hero-image {
    height: 245px;
  }

  .detail-heading {
    padding: 16px 14px 10px;
  }

  .detail-heading h2 {
    font-size: 23px;
  }

  .facts-line {
    padding: 0 14px 14px;
  }

  .layout-note,
  .modifier-section,
  .prompt-section {
    margin: 0 14px;
  }
}

@media (max-width: 410px) {
  .position-grid {
    grid-template-columns: 1fr;
  }

  .filter-rail {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .compact-control {
    grid-column: 1 / 2;
  }

  .favorite-filter {
    grid-column: 2 / 3;
  }

  .prompt-actions {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
  }
}
</style>

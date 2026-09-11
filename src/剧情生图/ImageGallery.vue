<template>
  <section class="story-image-gallery" aria-label="图库">
    <div class="story-image-gallery-filters">
      <label
        >图片类型
        <select v-model="kind" class="story-image-select">
          <option value="all">全部图片</option>
          <option value="story">剧情图</option>
          <option value="reference">参考图（含候选与上传）</option>
          <option value="other">其他图片</option>
        </select>
      </label>
      <label
        >范围
        <select v-model="scope" class="story-image-select">
          <option value="all">全部聊天</option>
          <option value="chat">当前聊天记录</option>
        </select>
      </label>
      <button type="button" class="story-image-btn" :disabled="loading" @click="refresh">刷新图库</button>
    </div>
    <p class="story-image-gallery-note">按保存时间从新到旧 · 包含本脚本已保存的剧情图、参考图、候选图及上传图片</p>
    <p v-if="scope === 'chat'" class="story-image-gallery-note">
      当前聊天范围仅匹配楼层记录；独立参考库图片请在“全部聊天”中查看。
    </p>
    <p v-if="chatError" role="status">{{ chatError }}</p>
    <p v-if="loading" role="status">正在读取图库……</p>
    <p v-else-if="error" role="alert">{{ error }}，请点击刷新重试。</p>
    <p v-else-if="!filtered.length">
      {{ files.length ? '当前筛选条件下没有图片。' : '还没有保存的图片，生成剧情图或保存参考图后会显示在这里。' }}
    </p>
    <template v-else>
      <p role="status">共 {{ filtered.length }} 张 · 已展示 {{ visible.length }} 张</p>
      <div class="story-image-gallery-grid">
        <button
          v-for="item in visible"
          :key="item.path"
          type="button"
          class="story-image-gallery-item"
          :aria-label="'预览：' + item.name"
          :title="item.name"
          @click="preview(item)"
        >
          <div class="story-image-gallery-thumb">
            <span v-if="failed.has(item.path)" class="story-image-gallery-missing">图片加载失败<br />点击重试预览</span>
            <img
              v-else
              :src="item.path"
              :alt="labels[item.kind]"
              loading="lazy"
              decoding="async"
              @error="failed.add(item.path)"
            />
          </div>
          <span class="story-image-gallery-meta"
            >{{ labels[item.kind] }}<span v-if="item.messageId !== undefined"> · 第 {{ item.messageId }} 楼</span></span
          >
          <time v-if="item.createdAt" class="story-image-gallery-meta">{{
            new Date(item.createdAt).toLocaleString()
          }}</time>
          <span v-else class="story-image-gallery-meta">历史图片</span>
        </button>
      </div>
      <button
        v-if="visible.length < filtered.length"
        type="button"
        class="story-image-btn story-image-gallery-more"
        @click="limit += 60"
      >
        加载更多
      </button>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { currentChatImages, galleryFromFiles, loadGallery, type GalleryImage, type GalleryKind } from './gallery';
import { openImagePreview } from './image-preview';
import { tavernDocument } from './tavern-dom';

const files = ref<string[]>([]);
const chatImages = ref(new Map<string, number>());
const kind = ref<GalleryKind | 'all'>('all');
const scope = ref<'all' | 'chat'>('all');
const loading = ref(false);
const error = ref('');
const chatError = ref('');
const limit = ref(60);
const failed = ref(new Set<string>());
const labels = { story: '剧情图', reference: '参考图', other: '其他图片' };
let controller: AbortController | undefined;
const filtered = computed(() =>
  galleryFromFiles(files.value, chatImages.value).filter(
    item =>
      (kind.value === 'all' || item.kind === kind.value) && (scope.value === 'all' || item.messageId !== undefined),
  ),
);
const visible = computed(() => filtered.value.slice(0, limit.value));
watch([kind, scope], () => {
  limit.value = 60;
});
function updateChat() {
  chatError.value = '';
  try {
    chatImages.value = currentChatImages(getChatMessages('0-{{lastMessageId}}'));
  } catch {
    chatImages.value = new Map();
    chatError.value = '当前聊天记录暂未就绪；全部图库仍可浏览，请稍后刷新。';
  }
}
async function refresh() {
  controller?.abort();
  const active = new AbortController();
  controller = active;
  loading.value = true;
  error.value = '';
  try {
    const result = await loadGallery(active.signal);
    if (active.signal.aborted) return;
    files.value = result;
    updateChat();
    failed.value.clear();
    limit.value = 60;
  } catch (e) {
    if (!active.signal.aborted) error.value = e instanceof Error ? e.message : String(e);
  } finally {
    if (controller === active) loading.value = false;
  }
}
function preview(item: GalleryImage) {
  openImagePreview(item.path, labels[item.kind], tavernDocument);
}
let stopChat: (() => void) | undefined;
onMounted(() => {
  void refresh();
  stopChat = eventOn(tavern_events.CHAT_CHANGED, () => {
    updateChat();
    limit.value = 60;
  }).stop;
});
onBeforeUnmount(() => {
  controller?.abort();
  stopChat?.();
});
</script>

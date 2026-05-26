<template>
  <span class="status-icon" :class="[size_class, tone_class, { 'is-glowing': glow, 'is-dimmed': dimmed }]">
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <template v-if="name === 'crest'">
        <path class="soft-fill" d="M12 2.8l6 2.2v6.3c0 4.4-2.4 8-6 9.9-3.6-1.9-6-5.5-6-9.9V5z" />
        <path d="M12 2.8l6 2.2v6.3c0 4.4-2.4 8-6 9.9-3.6-1.9-6-5.5-6-9.9V5z" />
        <path d="M12 5.5v13" />
        <path d="M8.8 9.1l3.2 2.2 3.2-2.2" />
        <path d="M9.1 14.1h5.8" />
      </template>

      <template v-else-if="name === 'protagonist'">
        <path class="soft-fill" d="M12 3.2l5 2v5.8c0 3.8-1.9 6.8-5 8.6-3.1-1.8-5-4.8-5-8.6V5.2z" />
        <path d="M12 3.2l5 2v5.8c0 3.8-1.9 6.8-5 8.6-3.1-1.8-5-4.8-5-8.6V5.2z" />
        <path d="M12 8.2a2.1 2.1 0 100 4.2 2.1 2.1 0 000-4.2z" />
        <path d="M8.8 16.2c.7-1.4 1.8-2.1 3.2-2.1s2.5.7 3.2 2.1" />
      </template>

      <template v-else-if="name === 'knight'">
        <path class="soft-fill" d="M12 2.7l5.7 2.1v6.5c0 4.1-2.2 7.2-5.7 9.1-3.5-1.9-5.7-5-5.7-9.1V4.8z" />
        <path d="M12 2.7l5.7 2.1v6.5c0 4.1-2.2 7.2-5.7 9.1-3.5-1.9-5.7-5-5.7-9.1V4.8z" />
        <path d="M12 5.4v12.8" />
        <path d="M9.1 8.8l2.9 2 2.9-2" />
        <path d="M8.9 13.2h6.2" />
        <path d="M10 16.1l2 1.2 2-1.2" />
      </template>

      <template v-else-if="name === 'female-rider'">
        <path class="soft-fill" d="M12 3.1l4.9 2v5.7c0 3.8-1.8 6.8-4.9 8.6-3.1-1.8-4.9-4.8-4.9-8.6V5.1z" />
        <path d="M12 3.1l4.9 2v5.7c0 3.8-1.8 6.8-4.9 8.6-3.1-1.8-4.9-4.8-4.9-8.6V5.1z" />
        <path d="M12 6.5v8.9" />
        <path d="M9.5 10.2h5" />
        <path d="M8.4 18.5c2.2 1 5 1 7.2 0" />
        <path d="M9.1 20.4h5.8" />
      </template>

      <template v-else-if="name === 'time'">
        <path class="soft-fill" d="M12 4.1a7.9 7.9 0 100 15.8 7.9 7.9 0 000-15.8z" />
        <path d="M12 4.1a7.9 7.9 0 100 15.8 7.9 7.9 0 000-15.8z" />
        <path d="M12 7.5v5l3.1 2" />
        <path d="M12 2.8v1.3" />
      </template>

      <template v-else-if="name === 'location'">
        <path class="soft-fill" d="M7 6.3h10v10.9H7z" />
        <path d="M7 6.3h10v10.9H7z" />
        <path d="M9.2 9h5.6" />
        <path d="M9.2 12h5.6" />
        <path d="M12 17.2v3" />
        <path d="M8.8 20.2h6.4" />
      </template>

      <template v-else-if="name === 'weather'">
        <path class="soft-fill" d="M8.5 16.5h8.7a3.4 3.4 0 00.2-6.8 5.3 5.3 0 00-10-1.4 4.1 4.1 0 001.1 8.2z" />
        <path d="M8.5 16.5h8.7a3.4 3.4 0 00.2-6.8 5.3 5.3 0 00-10-1.4 4.1 4.1 0 001.1 8.2z" />
        <path d="M5.8 19.2h8" />
        <path d="M15.8 19.2h2.4" />
      </template>

      <template v-else-if="name === 'environment'">
        <path class="soft-fill" d="M5 5.5h14v13H5z" />
        <path d="M5 5.5h14v13H5z" />
        <path d="M8 8.2h8" />
        <path d="M8 15.8h8" />
        <path d="M9 11.9c1.6-1 3.8 1 6-.1" />
      </template>

      <template v-else-if="name === 'todo'">
        <path class="soft-fill" d="M7 5.2h10v14H7z" />
        <path d="M7 5.2h10v14H7z" />
        <path d="M9.2 9h5.6" />
        <path d="M9.2 12.1h3" />
        <path d="M9.2 15.1l1.4 1.4 3-3.2" />
      </template>

      <template v-else-if="name === 'san'">
        <path class="soft-fill" d="M12 4.3a7.7 7.7 0 100 15.4 7.7 7.7 0 000-15.4z" />
        <path d="M12 4.3a7.7 7.7 0 100 15.4 7.7 7.7 0 000-15.4z" />
        <path d="M6.9 12.5h2.4l1.2-2.9 2.1 5.1 1.2-2.2h3.3" />
        <path d="M12 2.6v1.4" />
      </template>

      <template v-else-if="name === 'stamina'">
        <path class="soft-fill" d="M5.8 9.6c0-2 1.4-3.4 3.2-3.4 1.2 0 2.3.7 3 1.8.7-1.1 1.8-1.8 3-1.8 1.8 0 3.2 1.4 3.2 3.4 0 3.6-4.3 6.1-6.2 7.8-1.9-1.7-6.2-4.2-6.2-7.8z" />
        <path d="M5.8 9.6c0-2 1.4-3.4 3.2-3.4 1.2 0 2.3.7 3 1.8.7-1.1 1.8-1.8 3-1.8 1.8 0 3.2 1.4 3.2 3.4 0 3.6-4.3 6.1-6.2 7.8-1.9-1.7-6.2-4.2-6.2-7.8z" />
        <path d="M5.1 13h3.2l1.1-2.2 1.8 4.2 1.2-2h6.5" />
      </template>

      <template v-else-if="name === 'favor'">
        <path class="soft-fill" d="M12 5.1l6.9 6.9-6.9 6.9L5.1 12z" />
        <path d="M12 5.1l6.9 6.9-6.9 6.9L5.1 12z" />
        <path d="M8.9 12h6.2" />
        <path d="M12 8.9v6.2" />
      </template>

      <template v-else-if="name === 'relation'">
        <path class="soft-fill" d="M7.8 5l3.8 1.5v3.7c0 2.4-1.3 4.1-3.8 5.3C5.3 14.3 4 12.6 4 10.2V6.5z" />
        <path d="M7.8 5l3.8 1.5v3.7c0 2.4-1.3 4.1-3.8 5.3C5.3 14.3 4 12.6 4 10.2V6.5z" />
        <path d="M16.2 8.5l3.8 1.5v3.7c0 2.4-1.3 4.1-3.8 5.3-2.5-1.2-3.8-2.9-3.8-5.3V10z" />
        <path d="M11.2 12.4h1.6" />
      </template>

      <template v-else-if="name === 'appearance'">
        <path class="soft-fill" d="M6 4.8h12v14.4H6z" />
        <path d="M6 4.8h12v14.4H6z" />
        <path d="M12 8.2a2.3 2.3 0 100 4.6 2.3 2.3 0 000-4.6z" />
        <path d="M8.7 16.4c.8-1.4 1.9-2.1 3.3-2.1s2.5.7 3.3 2.1" />
      </template>

      <template v-else-if="name === 'body-record'">
        <path class="soft-fill" d="M7 5h10v14H7z" />
        <path d="M7 5h10v14H7z" />
        <path d="M10.1 8c1.7 1.3 1.7 2.9 0 4.5" />
        <path d="M13.9 8c-1.7 1.3-1.7 2.9 0 4.5" />
        <path d="M9.1 16h5.8" />
      </template>

      <template v-else-if="name === 'equipment'">
        <path class="soft-fill" d="M8 5.5h8l1.8 4.2-2.1 8.8H8.3L6.2 9.7z" />
        <path d="M8 5.5h8l1.8 4.2-2.1 8.8H8.3L6.2 9.7z" />
        <path d="M8.2 9.7h7.6" />
        <path d="M10 13h4" />
      </template>

      <template v-else-if="name === 'mobility'">
        <path class="soft-fill" d="M12 5.4a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2z" />
        <path d="M12 5.4a6.6 6.6 0 100 13.2 6.6 6.6 0 000-13.2z" />
        <path d="M12 12l4-3.1" />
        <path d="M4.6 12h2" />
        <path d="M17.4 12h2" />
        <path d="M12 4v1.4" />
        <path d="M12 18.6V20" />
      </template>

      <template v-else-if="name === 'close'">
        <path d="M7 7l10 10" />
        <path d="M17 7L7 17" />
      </template>

      <template v-else-if="name === 'back'">
        <path d="M14.5 6.5L9 12l5.5 5.5" />
        <path d="M9.5 12H19" />
      </template>

      <template v-else-if="name === 'expand'">
        <path d="M7 10l5 5 5-5" />
      </template>

      <template v-else-if="name === 'collapse'">
        <path d="M7 14l5-5 5 5" />
      </template>

      <template v-else>
        <path d="M9 6l6 6-6 6" />
      </template>
    </svg>
  </span>
</template>

<script setup lang="ts">
type StatusIconName =
  | 'crest'
  | 'protagonist'
  | 'knight'
  | 'female-rider'
  | 'time'
  | 'location'
  | 'weather'
  | 'environment'
  | 'todo'
  | 'san'
  | 'stamina'
  | 'favor'
  | 'relation'
  | 'appearance'
  | 'body-record'
  | 'equipment'
  | 'mobility'
  | 'chevron'
  | 'close'
  | 'back'
  | 'expand'
  | 'collapse';

type StatusIconTone = 'main' | 'muted' | 'blue' | 'cyan' | 'crimson' | 'amber' | 'danger' | 'dark';
type StatusIconSize = 'sm' | 'md' | 'lg' | 'badge';

const props = withDefaults(
  defineProps<{
    name: StatusIconName;
    tone?: StatusIconTone;
    size?: StatusIconSize;
    glow?: boolean;
    dimmed?: boolean;
  }>(),
  {
    tone: 'main',
    size: 'md',
    glow: false,
    dimmed: false,
  },
);

const tone_class = computed(() => `tone-${props.tone}`);
const size_class = computed(() => `size-${props.size}`);
</script>

<style lang="scss" scoped>
.status-icon {
  --icon-color: var(--icon-main);

  display: inline-grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  color: var(--icon-color);
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.36));
}

.status-icon svg {
  width: 100%;
  height: 100%;
  stroke-width: 1.8;
}

.soft-fill {
  fill: currentColor;
  opacity: 0.14;
  stroke: none;
}

.size-sm {
  width: 18px;
  height: 18px;
}

.size-md {
  width: 24px;
  height: 24px;
}

.size-lg {
  width: 36px;
  height: 36px;
}

.size-badge {
  width: 54px;
  height: 54px;
}

.size-badge svg {
  stroke-width: 2;
}

.tone-main {
  --icon-color: var(--icon-main);
}

.tone-muted {
  --icon-color: var(--icon-muted);
}

.tone-blue {
  --icon-color: var(--icon-blue);
}

.tone-cyan {
  --icon-color: var(--icon-cyan);
}

.tone-crimson {
  --icon-color: var(--icon-crimson);
}

.tone-amber {
  --icon-color: var(--icon-amber);
}

.tone-danger {
  --icon-color: var(--icon-danger);
}

.tone-dark {
  --icon-color: var(--icon-dark);
}

.is-glowing {
  filter: drop-shadow(0 0 8px color-mix(in srgb, var(--icon-color) 48%, transparent));
}

.is-dimmed {
  opacity: 0.55;
}
</style>

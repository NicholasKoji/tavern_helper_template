import { defineMvuDataStore } from '@util/mvu';
import { createPinia, defineStore } from 'pinia';
import { ref } from 'vue';
import { Schema } from '../../schema';
import mock_data from '../../世界书/变量/initvar.yaml';

export const createStatusPinia = createPinia;

export function isStatusMockPreview() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.has('mock') ||
    typeof Mvu === 'undefined' ||
    typeof getCurrentMessageId !== 'function' ||
    typeof getVariables !== 'function'
  );
}

const useMockDataStore = defineStore('mvu_data.mock.埃希斯特利亚.status_bar', () => {
  const data = ref(Schema.parse(mock_data));
  return { data };
});

export const useDataStore = isStatusMockPreview()
  ? useMockDataStore
  : defineMvuDataStore(Schema, { type: 'message', message_id: getCurrentMessageId() });

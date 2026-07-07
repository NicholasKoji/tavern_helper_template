import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './global.css';

async function waitForMvuData() {
  await waitGlobalInitialized('Mvu');

  try {
    await waitUntil(
      () => {
        const message_id = getCurrentMessageId();
        const variables = getVariables(
          message_id === undefined ? { type: 'message' } : { type: 'message', message_id },
        );
        return _.has(variables, 'stat_data');
      },
      { timeout: 5000, intervalBetweenAttempts: 120 },
    );
  } catch (error) {
    console.warn('[虚拟回响状态栏] 未在 5 秒内读取到楼层 MVU 数据，将使用 schema 默认值渲染。', error);
  }
}

$(async () => {
  await waitForMvuData();
  createApp(App).use(createPinia()).mount('#app');
});

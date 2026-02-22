import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    __ACTION_SEARCH_RELICS__: JSON.stringify('test_sr'),
    __ACTION_GET_RELIC_BY_ID__: JSON.stringify('test_gr'),
    __ACTION_GET_SERVERS__: JSON.stringify('test_gs'),
    __ACTION_GET_SLOT_TYPES__: JSON.stringify('test_st'),
    __ACTION_GET_ATTRIBUTES__: JSON.stringify('test_at'),
    __ACTION_GET_RELIC_DEFINITIONS__: JSON.stringify('test_rd'),
    __ACTION_GET_ENHANCEMENT_CURVE__: JSON.stringify('test_ec'),
    __ACTION_GET_NOTIFICATION_FILTERS__: JSON.stringify('test_nf'),
    __ACTION_CREATE_NOTIFICATION_FILTER__: JSON.stringify('test_cn'),
    __ACTION_DELETE_NOTIFICATION_FILTER__: JSON.stringify('test_dn'),
    __ACTION_UPDATE_NOTIFICATION_FILTER__: JSON.stringify('test_un'),
    __ACTION_TOGGLE_NOTIFICATION_FILTER__: JSON.stringify('test_tn'),
    __ACTION_GENERATE_TELEGRAM_LINK__: JSON.stringify('test_tl'),
    __ACTION_GET_TELEGRAM_BINDING_STATUS__: JSON.stringify('test_tbs'),
    __ACTION_DELETE_TELEGRAM_BINDING__: JSON.stringify('test_dtb'),
    __ACTION_GET_NOTIFICATION_SETTINGS__: JSON.stringify('test_gns'),
    __ACTION_UPDATE_NOTIFICATION_SETTINGS__: JSON.stringify('test_uns'),
    __ACTION_SEND_TEST_NOTIFICATION__: JSON.stringify('test_stn'),
    __ACTION_GET_PRICE_TRENDS__: JSON.stringify('test_pt'),
    __SIGNING_SECRET__: JSON.stringify('test_signing_secret_for_vitest'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})

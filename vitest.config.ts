import { defineConfig } from 'vitest/config';
import vuePlugin from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vuePlugin(), svgLoader()],
  resolve: {
    alias: {
      'vue-fields-ms': resolve(__dirname, 'src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
  },
});

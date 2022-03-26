// vite.config.js
const path = require('path');
const { defineConfig } = require('vite');
import vuePlugin from "@vitejs/plugin-vue";

module.exports = defineConfig({
  plugins: [vuePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'MS Vue Fields',
      fileName: (format) => `ms-vue-fields.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
});

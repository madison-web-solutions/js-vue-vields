import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import path from "path";
import vuePlugin from "@vitejs/plugin-vue";

module.exports = defineConfig({
  plugins: [vuePlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL("./src", import.meta.url)),
      'ckeditor': fileURLToPath(new URL("./ckeditor5/ckeditor.js", import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      name: 'VueFieldsMs',
      fileName: (format) => `vue-fields-ms.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', 'date-format-ms'],
    }
  }
});

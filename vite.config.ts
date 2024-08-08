import { defineConfig } from "vite";
import { fileURLToPath, URL } from "url";
import path from "path";
import vuePlugin from "@vitejs/plugin-vue";

module.exports = defineConfig({
  plugins: [vuePlugin()],
  resolve: {
    alias: { // must also add to tsconfig.app.json to get VSCode to understand the aliases
      'vue-fields-ms': fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      '@scss': fileURLToPath(new URL("./scss", import.meta.url)),
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

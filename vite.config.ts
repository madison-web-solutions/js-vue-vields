import { defineConfig } from "vite";
import path from "path";
import vuePlugin from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vuePlugin(),
    dts({
      include: ['src'],
      tsconfigPath: 'tsconfig.build.json',
    }),
  ],
  resolve: {
    alias: { // must also add to tsconfig.app.json to get VSCode to understand the aliases
      'vue-fields-ms': path.resolve(__dirname, "./src/main.ts"),
      '@scss': path.resolve(__dirname, "./scss"),
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
      name: 'VueFieldsMs',
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['vue', 'date-format-ms'],
    }
  }
});

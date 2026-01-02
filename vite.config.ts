import { defineConfig } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vuePlugin(),
    svgLoader(),
  ],
  resolve: {
    alias: {
      // This is only needed for running the demo app
      // It means within the demo app, we can import from 'vue-fields-ms' just like we would do when using the library in a project.
      'vue-fields-ms': resolve(__dirname, 'src/index.ts'),
    },
  },
  build: {
    cssCodeSplit: true,
    lib: {
      // Entrypoint in the source code
      entry: resolve(__dirname, 'src/index.ts'),
      // We will only support (and output) the ES format
      formats: ['es'],
      // Name of entry point file created when the library is built
      fileName: 'index'
    },
    rollupOptions: {
      // The following dependencies should not be bundled into the library
      external: ['vue', 'date-format-ms', 'ckeditor'],
    },
    outDir: 'dist', // default, but explicit
    emptyOutDir: true
  }
});

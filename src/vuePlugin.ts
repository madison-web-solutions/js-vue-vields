import type { App } from "vue";
import type { Config, VueFieldsMsPluginOptions } from "./types";
import { ref } from "vue";
import injectionSymbols from "./lib/injection-symbols";
import { defaultConfig } from "./lib/config";
import { createUploadedFileCache } from "./lib/uploadedFileCache";
import FieldWrapper from "./components/FieldWrapper.vue";

export const vueFieldsMsPlugin = (app: App, opts: VueFieldsMsPluginOptions): void => {

  if (opts.choicesProvider) {
    app.provide(injectionSymbols.choicesProvider, opts.choicesProvider);
  }
  if (opts.linksProvider) {
    app.provide(injectionSymbols.linksProvider, opts.linksProvider);
  }
  if (opts.mediaProvider) {
    app.provide(injectionSymbols.mediaProvider, opts.mediaProvider);
  }
  if (opts.uploadProvider) {
    app.provide(injectionSymbols.uploadProvider, opts.uploadProvider);
  }
  if (opts.passwordStrengthProvider) {
    app.provide(injectionSymbols.passwordStrengthProvider, opts.passwordStrengthProvider);
  }
  app.provide(injectionSymbols.fieldWrapperComponent, opts.fieldWrapperComponent ?? FieldWrapper);

  // The uploaded-file cache backs FileUploadField's `inline` mode. It is always provided (it's
  // cheap and stateless until used) so inline file uploads work with no extra configuration.
  app.provide(injectionSymbols.uploadedFileCache, createUploadedFileCache());

  // Merge into a fresh object — Object.assign(defaultConfig, ...) would mutate the shared
  // defaultConfig that getConfigValue/useExtendsConfig fall back to elsewhere.
  const config: Config = { ...defaultConfig, ...opts.config };
  app.provide(injectionSymbols.config, ref(config));
};


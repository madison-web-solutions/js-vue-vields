import type { App } from "vue";
import type { Config, VueFieldsMsPluginOptions } from "./types";
import { ref } from "vue";
import injectionSymbols from "./lib/injection-symbols";
import { defaultConfig } from "./lib/config";
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
  if (opts.passwordStrengthProvider) {
    app.provide(injectionSymbols.passwordStrengthProvider, opts.passwordStrengthProvider);
  }
  app.provide(injectionSymbols.fieldWrapperComponent, opts.fieldWrapperComponent ?? FieldWrapper);

  const config: Config = Object.assign(defaultConfig, opts.config);
  app.provide(injectionSymbols.config, ref(config));
};


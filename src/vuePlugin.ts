import type { App } from "vue";
import type { Config, VueFieldsMsPluginOptions } from "./types";
import { ref } from "vue";
import injectionSymbols from "./lib/injection-symbols";
import { defaultConfig } from "./lib/config";

export const vueFieldsMsPlugin = (app: App, opts: VueFieldsMsPluginOptions): void => {

  if (opts.choicesProvider) {
    app.provide(injectionSymbols.choicesProvider, opts.choicesProvider);
  }
  if (opts.mediaProvider) {
    app.provide(injectionSymbols.mediaProvider, opts.mediaProvider);
  }
  if (opts.passwordStrengthProvider) {
    app.provide(injectionSymbols.passwordStrengthProvider, opts.passwordStrengthProvider);
  }

  const config: Config = Object.assign(defaultConfig, opts.config);
  app.provide(injectionSymbols.config, ref(config));
};


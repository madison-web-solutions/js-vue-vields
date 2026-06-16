import type { Ref } from "vue";
import { inject, provide, computed } from "vue";
import type { Config, Loose } from "../types";
import injectionSymbols from "./injection-symbols";
import { defaultConfig } from "./config";
import { mergeLoose } from "./type-utils";

export default function useExtendsConfig(overrides: Ref<Loose<Config> | undefined> | undefined): Ref<Partial<Config>> {
  const parentConfig = inject(injectionSymbols.config, undefined);

  // Inherit the parent config (the plugin-provided config at the root, or an enclosing
  // container's), then apply only this container's explicit overrides on top. Building from
  // defaultConfig here instead would reset every key the container does not set back to its
  // default, discarding values inherited from the plugin or an outer container.
  const config = computed((): Config => {
    const parentConfigValue: Config = parentConfig?.value ?? defaultConfig;
    return mergeLoose(parentConfigValue, overrides?.value ?? {});
  });

  provide(injectionSymbols.config, config);

  return config;
};
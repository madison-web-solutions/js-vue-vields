import type { Ref } from "vue";
import { inject, provide, computed } from "vue";
import type { Config, Loose } from "../types";
import injectionSymbols from "./injection-symbols";
import { defaultConfig } from "./config";
import { mergeLoose } from "./type-utils";

export default function useExtendsConfig(overrides: Ref<Loose<Config> | undefined> | undefined): Ref<Partial<Config>> {
  const parentConfig = inject(injectionSymbols.config, undefined);

  const config = computed((): Config => {
    const parentConfigValue: Config = parentConfig?.value ?? defaultConfig;
    const overridesValue: Config = mergeLoose(defaultConfig, overrides?.value ?? {});
    return {...parentConfigValue, ...overridesValue};
  });

  provide(injectionSymbols.config, config);

  return config;
};

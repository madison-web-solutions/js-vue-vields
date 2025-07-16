import type { Ref } from "vue";
import type { Config, ConfigKey } from "../types";
import { inject, computed, unref } from "vue";
import injectionSymbols from "./injection-symbols";

export const defaultConfig: Config = {
  noValueLabel: "(none)",
  "textArea.numRows": 4,
  "currency.currencyCode": null,
  "currency.showCurrency": false,
  "html.subSuperScript": false,
  "html.code": false,
  "html.tables": false,
  "media.supportCropCenter": false,
};

export const getConfigValue = <K extends ConfigKey>(config: Partial<Config> | undefined, key: K): Config[K] => {
  if (config && key in config) {
    return config[key] as Config[K];
  } else {
    return defaultConfig[key];
  }
};

// Must be used in setup() functions
export const getConfigRef = <K extends ConfigKey>(key: K, override?: Ref<Config[K] | undefined> | Config[K] | undefined, config?: Ref<Partial<Config> | undefined> | undefined): Ref<Config[K]> => {
  if (config == null) {
    config = inject(injectionSymbols.config, undefined);
  }
  return computed(() => {
    const overrideValue = unref(override);
    if (overrideValue != null) {
      return overrideValue;
    } else {
      return getConfigValue(config?.value, key);
    }
  });
};


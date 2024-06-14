import type { Config, ConfigKey } from '@/main';
import type { Ref } from 'vue';
import { symbols } from '@/main';
import { computed, inject } from 'vue';

export const defaultConfig: Config = {
    'textArea.numRows': 5,
    'currency.currencyCode': null,
    'currency.showCurrency': false,
    'media.supportCropCenter': false,
};

export const getConfigValue = <K extends ConfigKey>(config: Partial<Config> | undefined, key: K): Config[K] => {
    if (config && key in config) {
        return config[key] as Config[K];
    } else {
        return defaultConfig[key];
    }
};

export const getConfigRef = <K extends ConfigKey>(key: K, propRef?: Ref<Config[K] | undefined> | undefined, config?: Ref<Partial<Config> | undefined> | undefined): Ref<Config[K]> => {
    if (config == null) {
        config = inject(symbols.config, undefined);
    }
    return computed(() => {
        if (propRef && propRef.value != null) {
            return propRef.value;
        }
        return getConfigValue(config?.value, key);
    });
};

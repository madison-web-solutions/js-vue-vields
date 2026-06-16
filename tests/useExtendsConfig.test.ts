// useExtendsConfig lets a container (FieldGroup, Repeater, ...) layer its own config overrides on
// top of the config it inherits — from the plugin at the root, or an enclosing container. The key
// behaviour these tests pin down: a container must NOT reset inherited keys it does not itself
// override (regression — it previously rebuilt from defaults and discarded the inherited config).

import { describe, test, expect } from 'vitest';
import { defineComponent, h, inject, ref } from 'vue';
import { mount } from '@vue/test-utils';
import injectionSymbols from '../src/lib/injection-symbols';
import { defaultConfig } from '../src/lib/config';
import useExtendsConfig from '../src/lib/useExtendsConfig';
import type { Config, Loose } from '../src/types';

// Mount: root provides `rootConfig`, a container applies `containerOverrides` via useExtendsConfig,
// and the leaf reads the resulting config back out. Returns the config the leaf sees.
const configSeenByLeaf = (
  rootConfig: Config | undefined,
  containerOverrides: Loose<Config> | undefined,
): Config | undefined => {
  let seen: Config | undefined;

  const Leaf = defineComponent({
    setup() {
      seen = inject(injectionSymbols.config, undefined)?.value;
      return () => h('div');
    },
  });

  const Container = defineComponent({
    setup() {
      useExtendsConfig(ref(containerOverrides));
      return () => h(Leaf);
    },
  });

  const Root = defineComponent({
    provide() {
      return rootConfig ? { [injectionSymbols.config as symbol]: ref(rootConfig) } : {};
    },
    setup: () => () => h(Container),
  });

  mount(Root);
  return seen;
};

describe('useExtendsConfig', () => {
  test('inherits a root config value when the container has no overrides', () => {
    const root: Config = { ...defaultConfig, 'text.autofillReconcile': true };
    expect(configSeenByLeaf(root, undefined)?.['text.autofillReconcile']).toBe(true);
  });

  test('a container override wins over the inherited value', () => {
    const root: Config = { ...defaultConfig, 'textArea.numRows': 9 };
    expect(configSeenByLeaf(root, { 'textArea.numRows': 3 })?.['textArea.numRows']).toBe(3);
  });

  test('overriding one key leaves other inherited keys intact', () => {
    const root: Config = { ...defaultConfig, 'text.autofillReconcile': true, noValueLabel: 'Empty' };
    const seen = configSeenByLeaf(root, { noValueLabel: 'Nothing' });
    expect(seen?.noValueLabel).toBe('Nothing');           // overridden
    expect(seen?.['text.autofillReconcile']).toBe(true);  // inherited, not reset to default
  });

  test('falls back to defaults when there is no root config', () => {
    expect(configSeenByLeaf(undefined, undefined)?.['text.autofillReconcile']).toBe(false);
    expect(configSeenByLeaf(undefined, undefined)?.['textArea.numRows']).toBe(4);
  });
});

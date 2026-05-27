import { describe, test, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { EditMode } from '../src/types';
import type { PasswordStrengthProvider } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import PasswordField from '../src/components/PasswordField.vue';

const mockProvider: PasswordStrengthProvider = {
  maxStrength: 4,
  check: async (password: string) => (password.length >= 10 ? 4 : 2),
};

const mountWithProvider = (props: Record<string, unknown> = {}) =>
  mount(PasswordField, {
    props,
    global: { provide: { [injectionSymbols.passwordStrengthProvider as symbol]: mockProvider } },
  });

describe('PasswordField', () => {
  test('renders a password-type input', () => {
    const wrapper = mount(PasswordField);
    expect(wrapper.find('input').attributes('type')).toBe('password');
  });

  test('no strength meter rendered when minStrength prop is omitted', () => {
    const wrapper = mountWithProvider({ modelValue: 'secretpassword' });
    expect(wrapper.find('.progress').exists()).toBe(false);
  });

  test('strength meter hidden when no provider is injected', async () => {
    const wrapper = mount(PasswordField, { props: { modelValue: 'secretpassword', minStrength: 3 } });
    await flushPromises();
    expect(wrapper.find('.progress').exists()).toBe(false);
  });

  test('strength meter hidden when password is empty', async () => {
    const wrapper = mountWithProvider({ modelValue: null, minStrength: 3 });
    await flushPromises();
    expect(wrapper.find('.progress').exists()).toBe(false);
  });

  test('strength meter shows data-strength when provider returns a score', async () => {
    const wrapper = mountWithProvider({ modelValue: 'secretpassword', minStrength: 3 });
    await flushPromises();
    expect(wrapper.find('.progress').attributes('data-strength')).toBe('4');
  });

  test('short password receives lower score', async () => {
    const wrapper = mountWithProvider({ modelValue: 'short', minStrength: 3 });
    await flushPromises();
    expect(wrapper.find('.progress').attributes('data-strength')).toBe('2');
  });

  test('progress bar is bg-success when strength exceeds minStrength', async () => {
    const wrapper = mountWithProvider({ modelValue: 'secretpassword', minStrength: 3 });
    await flushPromises();
    expect(wrapper.find('.progress-bar').classes()).toContain('bg-success');
    expect(wrapper.find('.progress-bar').classes()).not.toContain('bg-danger');
  });

  test('progress bar is bg-danger when strength is at or below minStrength', async () => {
    const wrapper = mountWithProvider({ modelValue: 'short', minStrength: 3 });
    await flushPromises();
    expect(wrapper.find('.progress-bar').classes()).toContain('bg-danger');
    expect(wrapper.find('.progress-bar').classes()).not.toContain('bg-success');
  });

  test('view mode renders asterisks', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { PasswordField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('mysecret') };
      },
      template: '<PasswordField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.text()).toContain('****');
  });
});

import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Choosable } from '../src/types';
import { lastEmittedValue } from './utils';
import SelectField from '../src/components/SelectField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

const nullOption = (wrapper: ReturnType<typeof mount>) =>
  wrapper.find('option').element as HTMLOptionElement;

describe('SelectField', () => {
  test('reflects selected value as the selected option', () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'green', choices: TEST_CHOICES } });
    expect((wrapper.find('select').element as HTMLSelectElement).selectedIndex).toBe(2);
  });

  test('null option is selected when modelValue is null', () => {
    const wrapper = mount(SelectField, { props: { modelValue: null, choices: TEST_CHOICES } });
    expect((wrapper.find('select').element as HTMLSelectElement).selectedIndex).toBe(0);
  });

  test('selecting the null option emits null', async () => {
    const wrapper = mount(SelectField, { props: { modelValue: 'red', choices: TEST_CHOICES } });
    (wrapper.find('select').element as HTMLSelectElement).selectedIndex = 0;
    await wrapper.find('select').trigger('change');
    expect(lastEmittedValue(wrapper)).toBeNull();
  });

  test('null option is enabled by default', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES } });
    expect(nullOption(wrapper).disabled).toBe(false);
  });

  test('required prop disables the null option', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES, required: true } });
    expect(nullOption(wrapper).disabled).toBe(true);
  });

  test('null option label is empty when no placeholder and not required', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES } });
    expect(nullOption(wrapper).textContent).toBe('');
  });

  test('null option label shows the placeholder text', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES, placeholder: 'Pick one' } });
    expect(nullOption(wrapper).textContent).toBe('Pick one');
  });

  test('null option label is "Select" when required and no placeholder', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES, required: true } });
    expect(nullOption(wrapper).textContent).toBe('Select');
  });

  test('autocomplete prop is passed through to the select element', () => {
    const wrapper = mount(SelectField, { props: { choices: TEST_CHOICES, autocomplete: 'country' } });
    expect(wrapper.find('select').attributes('autocomplete')).toBe('country');
  });
});

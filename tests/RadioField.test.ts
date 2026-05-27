import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Choosable } from '../src/types';
import RadioField from '../src/components/RadioField.vue';

const TEST_CHOICES: Choosable[] = [
  { key: 'red',   label: 'Red'   },
  { key: 'green', label: 'Green' },
  { key: 'blue',  label: 'Blue'  },
];

describe('RadioField', () => {
  test('reflects selected value as the checked radio input', () => {
    const wrapper = mount(RadioField, { props: { modelValue: 'green', choices: TEST_CHOICES } });
    const radios = wrapper.findAll('input[type="radio"]');
    expect((radios[0].element as HTMLInputElement).checked).toBe(false);
    expect((radios[1].element as HTMLInputElement).checked).toBe(true);
    expect((radios[2].element as HTMLInputElement).checked).toBe(false);
  });

  test('without inline prop, choice wrappers do not have form-check-inline', () => {
    const wrapper = mount(RadioField, { props: { choices: TEST_CHOICES } });
    for (const div of wrapper.findAll('.form-check')) {
      expect(div.classes()).not.toContain('form-check-inline');
    }
  });

  test('inline prop adds form-check-inline to each choice wrapper', () => {
    const wrapper = mount(RadioField, { props: { choices: TEST_CHOICES, inline: true } });
    for (const div of wrapper.findAll('.form-check')) {
      expect(div.classes()).toContain('form-check-inline');
    }
  });

  test('choices as a comma-separated string renders each key with a startCase label', () => {
    const wrapper = mount(RadioField, { props: { choices: 'red,green,blue' } });
    const labels = wrapper.findAll('.form-check-label').map((l) => l.text());
    expect(labels).toEqual(['Red', 'Green', 'Blue']);
  });

  test('choices as an object map uses the object values as labels', () => {
    const wrapper = mount(RadioField, { props: { choices: { red: 'Red', green: 'Lime' } } });
    const labels = wrapper.findAll('.form-check-label').map((l) => l.text());
    expect(labels).toEqual(['Red', 'Lime']);
  });

  test('choices as an array of strings uses startCase as the label', () => {
    const wrapper = mount(RadioField, { props: { choices: ['red', 'green'] } });
    const labels = wrapper.findAll('.form-check-label').map((l) => l.text());
    expect(labels).toEqual(['Red', 'Green']);
  });
});

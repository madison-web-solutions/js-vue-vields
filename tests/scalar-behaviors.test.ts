// Shared FieldWrapper behaviour tests for all scalar field components.
//
// Every scalar field uses useFormField + FieldWrapper, which provides label rendering, error
// display, disabled state, and view mode. Running these tests against every fixture ensures
// coverage is not contingent on which component happens to be tested individually.
//
// extraProps: some components (e.g. RadioField) need additional props to render a usable
//   control — these are merged into the props at mount time.
// skipTests: names of tests that are structurally inapplicable for a given component.

import { describe, test, expect } from 'vitest';
import { defineComponent, provide, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { Component } from 'vue';
import type { EditMode } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import TextField from '../src/components/TextField.vue';
import TextAreaField from '../src/components/TextAreaField.vue';
import CheckboxField from '../src/components/CheckboxField.vue';
import NumberField from '../src/components/NumberField.vue';
import CurrencyField from '../src/components/CurrencyField.vue';
import TimeField from '../src/components/TimeField.vue';
import ToggleField from '../src/components/ToggleField.vue';
import DateField from '../src/components/DateField.vue';
import PasswordField from '../src/components/PasswordField.vue';
import SelectField from '../src/components/SelectField.vue';
import RadioField from '../src/components/RadioField.vue';
import CustomRadioField from '../src/components/CustomRadioField.vue';
import CustomSelectField from '../src/components/CustomSelectField.vue';

type ScalarFixture = {
  label: string;
  component: Component;
  initialValue: unknown;
  controlSel: string;
  extraProps?: Record<string, unknown>;
  skipTests?: string[];
};

const fixtures: ScalarFixture[] = [
  { label: 'TextField',     component: TextField,     initialValue: 'test',       controlSel: 'input'    },
  { label: 'TextAreaField', component: TextAreaField, initialValue: 'test',       controlSel: 'textarea' },
  { label: 'CheckboxField', component: CheckboxField, initialValue: false,        controlSel: 'input'    },
  { label: 'NumberField',   component: NumberField,   initialValue: 42,           controlSel: 'input'    },
  { label: 'CurrencyField', component: CurrencyField, initialValue: 1250,         controlSel: 'input'    },
  { label: 'TimeField',     component: TimeField,     initialValue: '14:30',      controlSel: 'input'    },
  { label: 'ToggleField',   component: ToggleField,   initialValue: false,        controlSel: 'input'    },
  { label: 'DateField',     component: DateField,     initialValue: '2024-01-15', controlSel: 'input'    },
  { label: 'PasswordField', component: PasswordField, initialValue: 'secret',     controlSel: 'input'    },
  { label: 'SelectField',   component: SelectField,   initialValue: null,         controlSel: 'select'   },
  {
    label: 'RadioField',
    component: RadioField,
    initialValue: 'a',
    controlSel: 'input[type="radio"]',
    // Choices are required — without them no radio inputs render and errors/disabled tests fail.
    extraProps: { choices: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }] },
    // FieldWrapper label's `for` points to field.inputEleId, but radio inputs have IDs
    // field.inputEleId + choiceKey, so there is no single element that matches.
    skipTests: ['label-for'],
  },
  {
    label: 'CustomRadioField',
    component: CustomRadioField,
    initialValue: 'a',
    controlSel: '.vfm-custom-radio',
    extraProps: { choices: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }] },
    // No single labelled input (no id on div), and div elements have no .disabled DOM property.
    skipTests: ['label-for', 'disabled'],
  },
  {
    label: 'CustomSelectField',
    component: CustomSelectField,
    initialValue: null,
    controlSel: '.form-select',
    // No id on the trigger div, and div elements have no .disabled DOM property.
    skipTests: ['label-for', 'disabled'],
  },
];

describe.each(fixtures)('$label', (f) => {

  // ─── Label rendering ──────────────────────────────────────────────────────

  test('renders a label element when the label prop is provided', () => {
    const wrapper = mount(f.component, { props: { label: 'Test label' } });
    expect(wrapper.find('label').text()).toContain('Test label');
  });

  test.skipIf(f.skipTests?.includes('label-for'))('label for attribute matches the control id', () => {
    const wrapper = mount(f.component, { props: { label: 'Test label', ...f.extraProps } });
    const controlId = wrapper.find(f.controlSel).attributes('id');
    expect(controlId).toBeTruthy();
    expect(wrapper.find('label').attributes('for')).toBe(controlId);
  });

  // ─── Error prop ───────────────────────────────────────────────────────────

  test('errors prop adds is-invalid to the control and shows the message', async () => {
    const wrapper = mount(f.component, { props: { modelValue: f.initialValue, ...f.extraProps } });
    expect(wrapper.find(f.controlSel).classes()).not.toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').exists()).toBe(false);

    await wrapper.setProps({ errors: { '': ['Something went wrong'] } });
    expect(wrapper.find(f.controlSel).classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('Something went wrong');

    await wrapper.setProps({ errors: {} });
    expect(wrapper.find(f.controlSel).classes()).not.toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').exists()).toBe(false);
  });

  // ─── Disabled ─────────────────────────────────────────────────────────────

  test.skipIf(f.skipTests?.includes('disabled'))('disabled prop enables and disables the control', async () => {
    const wrapper = mount(f.component, { props: { modelValue: f.initialValue, disabled: false, ...f.extraProps } });
    expect((wrapper.find(f.controlSel).element as HTMLInputElement).disabled).toBe(false);

    await wrapper.setProps({ disabled: true });
    expect((wrapper.find(f.controlSel).element as HTMLInputElement).disabled).toBe(true);

    await wrapper.setProps({ disabled: false });
    expect((wrapper.find(f.controlSel).element as HTMLInputElement).disabled).toBe(false);
  });

  // ─── View mode ────────────────────────────────────────────────────────────

  test('control is not rendered in view mode', () => {
    const Parent = defineComponent({
      components: { Field: f.component },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref(f.initialValue) };
      },
      template: '<Field v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find(f.controlSel).exists()).toBe(false);
  });
});

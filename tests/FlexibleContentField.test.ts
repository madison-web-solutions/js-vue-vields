import { describe, test, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, provide, ref } from 'vue';
import type { Ref } from 'vue';
import type { Choosable, EditMode, MessageBag } from '../src/types';
import injectionSymbols from '../src/lib/injection-symbols';
import FlexibleContentField from '../src/components/FlexibleContentField.vue';
import TextField from '../src/components/TextField.vue';
import TextAreaField from '../src/components/TextAreaField.vue';
import SelectField from '../src/components/SelectField.vue';
import TimestampField from '../src/components/TimestampField.vue';

// FlexibleContentField wraps RepeaterField, adding a per-row "content_type" SelectField and
// rendering a named slot chosen by that type. Generic repeater behaviour (add/remove/reorder,
// min/max, view mode) is covered by repeater-behaviors.test.ts — these tests focus on what is
// unique here: the content-type selector → slot-selection → nested-value-routing wiring.
//
// Three deliberately distinct section shapes are used so "the right fields show" is meaningful:
//   text    → a single TextField (input)
//   details → a TextAreaField + a TimestampField (textarea + date input)
//   choice  → a SelectField (a second select, alongside the content_type select)
//
// Child fields expose their fully-qualified path on the name attribute, e.g. name="0.heading"
// for the heading field of row 0. This matches the error-bag key convention (also "0.heading").

const sectionChoices: Choosable[] = [
  { key: 'text',    label: 'Text Block'    },
  { key: 'details', label: 'Details Block' },
  { key: 'choice',  label: 'Choice Block'  },
];

const catChoices: Choosable[] = [
  { key: 'news', label: 'News' },
  { key: 'blog', label: 'Blog' },
];

const mountFlexible = (rows: unknown[] = [], editMode?: Ref<EditMode>) => {
  const value = ref<unknown[]>([...rows]);
  const errors = ref<MessageBag>({});
  const Parent = defineComponent({
    components: { FlexibleContentField, TextField, TextAreaField, SelectField, TimestampField },
    setup() {
      if (editMode) provide(injectionSymbols.editMode, editMode);
      return { value, errors, sectionChoices, catChoices };
    },
    template: `
      <FlexibleContentField v-model="value" v-model:errors="errors" :sectionChoices="sectionChoices">
        <template #text>
          <TextField name="heading" label="Heading" />
        </template>
        <template #details>
          <TextAreaField name="summary" label="Summary" />
          <TimestampField name="published_at" label="Published" timeZone="utc" />
        </template>
        <template #choice>
          <SelectField name="category" label="Category" :choices="catChoices" />
        </template>
      </FlexibleContentField>
    `,
  });
  return { value, errors, wrapper: mount(Parent) };
};

const rowsOf = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.vfm-repeater-item');

// Select a section type on the content_type dropdown of the given row.
// choiceIndex is the 0-based index into sectionChoices; +1 skips the null option.
const setContentType = async (
  wrapper: ReturnType<typeof mount>,
  rowIndex: number,
  choiceIndex: number,
) => {
  const select = wrapper.find(`select[name="${rowIndex}.content_type"]`);
  (select.element as HTMLSelectElement).selectedIndex = choiceIndex + 1;
  await select.trigger('change');
};

describe('FlexibleContentField', () => {

  test('renders a content-type selector for each row', () => {
    const { wrapper } = mountFlexible([
      { content_type: 'text' },
      { content_type: 'choice' },
    ]);
    expect(rowsOf(wrapper).length).toBe(2);
    expect(wrapper.find('select[name="0.content_type"]').exists()).toBe(true);
    expect(wrapper.find('select[name="1.content_type"]').exists()).toBe(true);
  });

  test('renders only the selected section type\'s fields', () => {
    const { wrapper } = mountFlexible([{ content_type: 'text', heading: 'Hi' }]);
    const row = rowsOf(wrapper)[0];
    expect(row.find('input[name="0.heading"]').exists()).toBe(true);
    expect(row.find('textarea').exists()).toBe(false);
    expect(row.find('input[type="date"]').exists()).toBe(false);
  });

  test('different rows render the fields for their own content type', () => {
    const { wrapper } = mountFlexible([
      { content_type: 'text',    heading: 'Hi'      },
      { content_type: 'details', summary: 'Summary' },
      { content_type: 'choice',  category: 'news'   },
    ]);

    // Row 0 — text: heading input only
    expect(wrapper.find('input[name="0.heading"]').exists()).toBe(true);

    // Row 1 — details: summary textarea + timestamp date input, no heading
    expect(wrapper.find('textarea[name="1.summary"]').exists()).toBe(true);
    expect(rowsOf(wrapper)[1].find('input[type="date"]').exists()).toBe(true);
    expect(wrapper.find('input[name="1.heading"]').exists()).toBe(false);

    // Row 2 — choice: category select (in addition to its content_type select)
    expect(wrapper.find('select[name="2.category"]').exists()).toBe(true);
    expect(wrapper.find('input[name="2.heading"]').exists()).toBe(false);
  });

  test('reflects existing subvalues in the rendered section fields', () => {
    const { wrapper } = mountFlexible([{ content_type: 'text', heading: 'Hello world' }]);
    const heading = wrapper.find('input[name="0.heading"]');
    expect((heading.element as HTMLInputElement).value).toBe('Hello world');
  });

  test('typing in a text section field updates the nested subvalue', async () => {
    const { value, wrapper } = mountFlexible([{ content_type: 'text', heading: '' }]);
    await wrapper.find('input[name="0.heading"]').setValue('New Heading');
    expect(value.value[0]).toEqual({ content_type: 'text', heading: 'New Heading' });
  });

  test('typing in a textarea section field updates the nested subvalue', async () => {
    const { value, wrapper } = mountFlexible([{ content_type: 'details', summary: '' }]);
    await wrapper.find('textarea[name="0.summary"]').setValue('A short summary');
    expect((value.value[0] as Record<string, unknown>).summary).toBe('A short summary');
  });

  test('selecting in a choice section field updates the nested subvalue', async () => {
    const { value, wrapper } = mountFlexible([{ content_type: 'choice', category: null }]);
    const catSelect = wrapper.find('select[name="0.category"]');
    (catSelect.element as HTMLSelectElement).selectedIndex = 1; // 'news'
    await catSelect.trigger('change');
    expect((value.value[0] as Record<string, unknown>).category).toBe('news');
  });

  test('changing the content type swaps the rendered fields and updates content_type', async () => {
    const { value, wrapper } = mountFlexible([{ content_type: 'text', heading: 'Hi' }]);
    expect(wrapper.find('input[name="0.heading"]').exists()).toBe(true);

    await setContentType(wrapper, 0, 1); // 'details'

    expect(wrapper.find('input[name="0.heading"]').exists()).toBe(false);
    expect(wrapper.find('textarea[name="0.summary"]').exists()).toBe(true);
    expect((value.value[0] as Record<string, unknown>).content_type).toBe('details');
  });

  // Documents current behaviour: switching content type does NOT clear the previous
  // section's data — the stale key remains in the row object.
  test('changing the content type retains previously entered subvalues', async () => {
    const { value, wrapper } = mountFlexible([{ content_type: 'text', heading: 'Kept' }]);
    await setContentType(wrapper, 0, 1); // 'details'
    expect((value.value[0] as Record<string, unknown>).heading).toBe('Kept');
    expect((value.value[0] as Record<string, unknown>).content_type).toBe('details');
  });

  test('an unset content type renders only the selector, no section fields', () => {
    const { wrapper } = mountFlexible([{}]);
    const row = rowsOf(wrapper)[0];
    expect(row.find('select[name="0.content_type"]').exists()).toBe(true);
    expect(row.find('input[name="0.heading"]').exists()).toBe(false);
    expect(row.find('textarea').exists()).toBe(false);
  });

  test('an unrecognized content type renders only the selector', () => {
    const { wrapper } = mountFlexible([{ content_type: 'nonexistent' }]);
    const row = rowsOf(wrapper)[0];
    expect(row.find('input[name="0.heading"]').exists()).toBe(false);
    expect(row.find('textarea').exists()).toBe(false);
  });

  test('per-field errors are shown on the correct field in the correct row', async () => {
    const { errors, wrapper } = mountFlexible([
      { content_type: 'text',    heading: '' },
      { content_type: 'details', summary: '' },
    ]);
    errors.value = { '0.heading': ['Heading is required'] };
    await nextTick();

    const rows = rowsOf(wrapper);
    const headingInput = wrapper.find('input[name="0.heading"]');
    expect(headingInput.classes()).toContain('is-invalid');
    expect(rows[0].find('[data-testid="field-error-messages"]').text()).toContain('Heading is required');

    // Row 1 (a different section type) must be unaffected
    expect(rows[1].find('[data-testid="field-error-messages"]').exists()).toBe(false);
  });
});

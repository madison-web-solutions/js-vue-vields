import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { defineComponent, provide, ref } from 'vue';
import type { EditMode } from '../src/types';
import { lastEmittedValue } from './utils';
import injectionSymbols from '../src/lib/injection-symbols';

// CKEditor 5 cannot run in jsdom (it needs real selection/range/layout APIs), and even if it
// could we'd be testing CKEditor, not our wrapper. So we replace the whole `ckeditor5` module
// with a fake editor that records the calls HtmlField makes. These tests verify our integration
// contract: seeding initial data, the debounced change→emit, external value sync, the disabled
// (read-only) toggle, and teardown. They assume CKEditor honours its documented API — if a future
// version renames change:data / getData / setData, these mocks stay green while production breaks.

const ckState = vi.hoisted(() => ({ instances: [] as any[] }));

vi.mock('ckeditor5', () => {
  // Minimal stand-in for a ClassicEditor instance, exposing only what HtmlField touches.
  class FakeEditor {
    data = '';
    changeHandler: (() => void) | null = null;
    readOnlyLocks = new Set<symbol>();
    destroyed = false;
    model = {
      document: {
        on: (event: string, cb: () => void) => {
          if (event === 'change:data') this.changeHandler = cb;
        },
      },
    };
    setData(s: string) { this.data = s; }
    getData() { return this.data; }
    enableReadOnlyMode(lock: symbol) { this.readOnlyLocks.add(lock); }
    disableReadOnlyMode(lock: symbol) { this.readOnlyLocks.delete(lock); }
    destroy() { this.destroyed = true; return Promise.resolve(); }
    // Test helper: emulate a user edit that fires CKEditor's change:data event.
    simulateInput(newData: string) { this.data = newData; this.changeHandler?.(); }
  }
  const ClassicEditor = {
    create: vi.fn(() => {
      const inst = new FakeEditor();
      ckState.instances.push(inst);
      return Promise.resolve(inst);
    }),
  };
  // Plugin / type exports HtmlField imports — only pushed into a config array we never execute.
  const dummy = {};
  return {
    ClassicEditor,
    Essentials: dummy, Bold: dummy, Italic: dummy, Paragraph: dummy, Heading: dummy,
    Strikethrough: dummy, Underline: dummy, Code: dummy, Link: dummy, Subscript: dummy,
    Superscript: dummy, Alignment: dummy, List: dummy, CodeBlock: dummy, BlockQuote: dummy,
    HorizontalLine: dummy, Table: dummy, Image: dummy, ImageToolbar: dummy, ImageStyle: dummy,
    PluginConstructor: dummy, Editor: dummy, ToolbarConfigItem: dummy,
  };
});

// Imported after vi.mock (which is hoisted), so HtmlField binds to the fake ckeditor5.
import HtmlField from '../src/components/HtmlField.vue';

const lastEditor = () => ckState.instances[ckState.instances.length - 1];

describe('HtmlField', () => {
  beforeEach(() => {
    ckState.instances.length = 0;
    vi.useFakeTimers();
  });
  afterEach(() => { vi.useRealTimers(); });

  test('view mode renders the HTML value and creates no editor', () => {
    const editMode = ref<EditMode>('view');
    const Parent = defineComponent({
      components: { HtmlField },
      setup() {
        provide(injectionSymbols.editMode, editMode);
        return { value: ref('<p>Hello <strong>world</strong></p>') };
      },
      template: '<HtmlField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.card-body').html()).toContain('<strong>world</strong>');
    expect(ckState.instances.length).toBe(0);
  });

  test('view mode shows the noValueLabel instead of an empty card when the value is empty', () => {
    const Parent = defineComponent({
      components: { HtmlField },
      setup() {
        provide(injectionSymbols.editMode, ref<EditMode>('view'));
        return { value: ref('') };
      },
      template: '<HtmlField v-model="value" />',
    });
    const wrapper = mount(Parent);
    expect(wrapper.find('.card').exists()).toBe(false);
    expect(wrapper.find('.vfm-no-value').text()).toBe('(none)');
  });

  test('edit mode creates an editor seeded with the initial value', async () => {
    mount(HtmlField, { props: { modelValue: '<p>Initial</p>' } });
    await flushPromises();
    expect(ckState.instances.length).toBe(1);
    expect(lastEditor().data).toBe('<p>Initial</p>');
  });

  test('editor changes emit update:modelValue after the debounce', async () => {
    const wrapper = mount(HtmlField, { props: { modelValue: '' } });
    await flushPromises();

    lastEditor().simulateInput('<p>typed</p>');
    // Nothing emitted until the 300ms debounce elapses
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();

    vi.advanceTimersByTime(300);
    expect(lastEmittedValue(wrapper)).toBe('<p>typed</p>');
  });

  test('does not re-emit when the editor fires change with unchanged data', async () => {
    const wrapper = mount(HtmlField, { props: { modelValue: '' } });
    await flushPromises();

    lastEditor().simulateInput('<p>x</p>');
    vi.advanceTimersByTime(300);
    expect(wrapper.emitted('update:modelValue')?.length).toBe(1);

    // Same data again — the lastEditorData guard should suppress a second emit
    lastEditor().simulateInput('<p>x</p>');
    vi.advanceTimersByTime(300);
    expect(wrapper.emitted('update:modelValue')?.length).toBe(1);
  });

  test('changing the modelValue prop pushes new data into the editor', async () => {
    const wrapper = mount(HtmlField, { props: { modelValue: '<p>one</p>' } });
    await flushPromises();
    expect(lastEditor().data).toBe('<p>one</p>');

    await wrapper.setProps({ modelValue: '<p>two</p>' });
    expect(lastEditor().data).toBe('<p>two</p>');
  });

  test('mounting disabled puts the editor in read-only mode', async () => {
    mount(HtmlField, { props: { modelValue: '', disabled: true } });
    await flushPromises();
    expect(lastEditor().readOnlyLocks.size).toBe(1);
  });

  test('toggling disabled enables and disables read-only mode', async () => {
    const wrapper = mount(HtmlField, { props: { modelValue: '', disabled: false } });
    await flushPromises();
    expect(lastEditor().readOnlyLocks.size).toBe(0);

    await wrapper.setProps({ disabled: true });
    expect(lastEditor().readOnlyLocks.size).toBe(1);

    await wrapper.setProps({ disabled: false });
    expect(lastEditor().readOnlyLocks.size).toBe(0);
  });

  test('unmounting destroys the editor', async () => {
    const wrapper = mount(HtmlField, { props: { modelValue: '' } });
    await flushPromises();
    const editor = lastEditor();
    expect(editor.destroyed).toBe(false);

    wrapper.unmount();
    await flushPromises();
    expect(editor.destroyed).toBe(true);
  });

  test('renders the label and applies is-invalid on error', async () => {
    const wrapper = mount(HtmlField, {
      props: { modelValue: '', label: 'Body', errors: { '': ['Required'] } },
    });
    await flushPromises();
    expect(wrapper.find('label').text()).toContain('Body');
    expect(wrapper.find('.vfm-html-field').classes()).toContain('is-invalid');
  });
});

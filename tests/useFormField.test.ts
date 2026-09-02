// Precedence tests for useFormField: an explicit v-model / v-model:errors on a
// field must override any ancestor-provided lens, AND must reset the inherited
// path so the field reports its own subtree as the root.
//
// The bug these tests pin down: when a parent FieldGroup provides a NamedLens
// (or any other lens), descendant fields with their own v-model used to ignore
// the v-model and read/write through the injected lens instead.
//
// "Explicit" means: the bound value is not `undefined`. The library treats
// `undefined` as "no binding here, inherit from the ancestor lens"; callers who
// want the v-model to own the field even when empty must initialise the ref to
// `null` or an empty string instead.
//
// Note: FieldGroup deliberately does NOT accept a `name` prop, so its presence
// never contributes to the lens-lookup or to field.pathString. Tests that need
// a path-contributing wrapper use CompoundField instead.

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { defineComponent, h, nextTick, ref, toRefs } from 'vue';
import { mount } from '@vue/test-utils';
import type { FieldEmitType, FieldProps, FormValue, MessageBag, RefsOf } from '../src/types';
import useFormField from '../src/lib/useFormField';
import type { UseFormFieldOptions } from '../src/lib/useFormField';
import { coerceToFormValue } from '../src/lib/type-utils';
import FieldGroup from '../src/components/FieldGroup.vue';
import CompoundField from '../src/components/CompoundField.vue';
import TextField from '../src/components/TextField.vue';

// Several tests here deliberately combine v-model with a name to assert the precedence
// behaviour; that combination is contradictory and logs a dev warning. Capture it so it
// doesn't clutter the test output (and so individual tests can assert it when relevant).
let warnSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => { warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { warnSpy.mockRestore(); });

// ─── Value binding precedence ────────────────────────────────────────────────

describe('explicit v-model overrides an injected valueLens', () => {

  test('TextField with v-model + name inside a FieldGroup reads/writes its own ref', async () => {
    // The classic bug case: TextField has BOTH a name (which would resolve to
    // outer.foo via the NamedLens) AND its own v-model. v-model must win.
    const outer = ref<Record<string, string>>({ foo: 'FROM_OUTER' });
    const inner = ref<string>('FROM_INNER');

    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup: () => ({ outer, inner }),
      template: `
        <FieldGroup v-model="outer">
          <TextField name="foo" v-model="inner" />
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = () => wrapper.find('input').element as HTMLInputElement;

    expect(input().value).toBe('FROM_INNER');

    await wrapper.find('input').setValue('TYPED');
    expect(inner.value).toBe('TYPED');
    expect(outer.value).toEqual({ foo: 'FROM_OUTER' }); // outer is untouched
  });

  test('CompoundField with v-model + name is a new value context for its children', async () => {
    // Mirrors the MediaDetails.vue scenario at the container level. Without the
    // fix, the inner CompoundField (name="profile") reads outer.profile via the
    // ancestor NamedLens and ignores its v-model. With the fix, the v-model'd
    // `inner` ref owns the subtree and propagates to TextField children.
    const outer = ref<Record<string, unknown>>({ profile: { first: 'IGNORE_ME', last: 'IGNORE_ME' } });
    const inner = ref<Record<string, string>>({ first: 'Alice', last: 'Smith' });

    const Parent = defineComponent({
      components: { FieldGroup, CompoundField, TextField },
      setup: () => ({ outer, inner }),
      template: `
        <FieldGroup v-model="outer">
          <CompoundField v-model="inner" name="profile">
            <TextField name="first" />
            <TextField name="last" />
          </CompoundField>
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const inputs = wrapper.findAll('input');
    expect((inputs[0].element as HTMLInputElement).value).toBe('Alice');
    expect((inputs[1].element as HTMLInputElement).value).toBe('Smith');

    await inputs[0].setValue('Bob');
    expect(inner.value.first).toBe('Bob');
    expect(inner.value.last).toBe('Smith');
    // outer must be untouched — the v-model on the inner CompoundField is the only
    // sink for its writes, regardless of the ancestor NamedLens.
    expect(outer.value).toEqual({ profile: { first: 'IGNORE_ME', last: 'IGNORE_ME' } });
  });

  test('null is the documented opt-in for "v-model wins even when empty"', async () => {
    // `undefined` deliberately means "no binding, inherit from ancestor lens".
    // To make v-model own an initially-empty field, callers must use `null`
    // (or an empty string) — anything but `undefined`.
    const outer = ref<Record<string, string>>({ foo: 'FROM_OUTER' });
    const inner = ref<string | null>(null);

    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup: () => ({ outer, inner }),
      template: `
        <FieldGroup v-model="outer">
          <TextField name="foo" v-model="inner" />
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = () => wrapper.find('input').element as HTMLInputElement;

    // The input must reflect `inner` (empty string for null), NOT 'FROM_OUTER'.
    expect(input().value).toBe('');

    await wrapper.find('input').setValue('typed-into-empty');
    expect(inner.value).toBe('typed-into-empty');
    expect(outer.value).toEqual({ foo: 'FROM_OUTER' });
  });

  test('v-model bound to ref(undefined) falls through to the ancestor lens (documented behaviour)', () => {
    // Sister case to the test above. `undefined` is reserved as the "no
    // binding" sentinel, so the field reads through the NamedLens here.
    const outer = ref<Record<string, string>>({ foo: 'FROM_OUTER' });
    const inner = ref<string | undefined>(undefined);

    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup: () => ({ outer, inner }),
      template: `
        <FieldGroup v-model="outer">
          <TextField name="foo" v-model="inner" />
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = wrapper.find('input').element as HTMLInputElement;
    expect(input.value).toBe('FROM_OUTER');
  });

});

// ─── Errors binding precedence ───────────────────────────────────────────────

describe('explicit v-model:errors overrides an injected errorsLens', () => {

  test('errors flow through the explicit v-model:errors ref, not the ancestor lens', async () => {
    const outer = ref<Record<string, string>>({ foo: 'x' });
    const outerErrors = ref<MessageBag>({});
    const inner = ref<string>('inner');
    const innerErrors = ref<MessageBag>({});

    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup: () => ({ outer, outerErrors, inner, innerErrors }),
      template: `
        <FieldGroup v-model="outer" v-model:errors="outerErrors">
          <TextField name="foo" v-model="inner" v-model:errors="innerErrors" />
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = () => wrapper.find('input');

    // Errors set through the OUTER errors ref keyed at 'foo' must NOT mark the field invalid,
    // because v-model:errors on the inner field shadows the ancestor lens entirely.
    outerErrors.value = { foo: ['from outer'] };
    await nextTick();
    expect(input().classes()).not.toContain('is-invalid');

    // Errors set through the INNER errors ref must mark the field invalid.
    innerErrors.value = { '': ['from inner'] };
    await nextTick();
    expect(input().classes()).toContain('is-invalid');
    expect(wrapper.find('[data-testid="field-error-messages"]').text()).toContain('from inner');
  });

});

// ─── Path resetting ──────────────────────────────────────────────────────────

describe('a v-model field is a fresh root and ignores its own name', () => {

  test('descendants report the value path from the new root (own name ignored), and it warns', () => {
    // <FG v-model="outer">
    //   <CompoundField name="profile">       ← contributes 'profile'
    //     <CompoundField v-model="inner" name="reset">
    //                                         ← v-model: fresh root; own name 'reset' is ignored
    //       <TextField name="bio" />          ← path is 'bio' (inner.bio), the value path from root
    //     </CompoundField>
    //   </CompoundField>
    // </FG>
    // The input `name` matches the value's path from its root: bio lives at inner.bio, so 'bio'.
    const outer = ref<Record<string, unknown>>({ profile: { reset: { bio: 'IGNORE' } } });
    const inner = ref<Record<string, string>>({ bio: 'about me' });

    const Parent = defineComponent({
      components: { FieldGroup, CompoundField, TextField },
      setup: () => ({ outer, inner }),
      template: `
        <FieldGroup v-model="outer">
          <CompoundField name="profile">
            <CompoundField v-model="inner" name="reset">
              <TextField name="bio" />
            </CompoundField>
          </CompoundField>
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    // TextField renders its pathString as the `name` attribute on the input.
    const input = wrapper.find('input');
    expect(input.attributes('name')).toBe('bio');
    // The contradictory v-model + name on the inner CompoundField is flagged.
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('contradictory'));
  });

  test('without v-model the path chain is unbroken (regression check)', () => {
    // Same shape as above but the inner CompoundField has no v-model — the path
    // must still chain all the way: 'profile.reset.bio'.
    const outer = ref<Record<string, unknown>>({ profile: { reset: { bio: 'about me' } } });

    const Parent = defineComponent({
      components: { FieldGroup, CompoundField, TextField },
      setup: () => ({ outer }),
      template: `
        <FieldGroup v-model="outer">
          <CompoundField name="profile">
            <CompoundField name="reset">
              <TextField name="bio" />
            </CompoundField>
          </CompoundField>
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = wrapper.find('input');
    expect(input.attributes('name')).toBe('profile.reset.bio');
  });

});

// ─── Regression: lens-only path unchanged ────────────────────────────────────

describe('lens-only fields (no v-model) behave exactly as before', () => {

  test('a child TextField with only a name reads and writes through the parent NamedLens', async () => {
    const outer = ref<Record<string, string>>({ foo: 'initial' });

    const Parent = defineComponent({
      components: { FieldGroup, TextField },
      setup: () => ({ outer }),
      template: `
        <FieldGroup v-model="outer">
          <TextField name="foo" />
        </FieldGroup>
      `,
    });

    const wrapper = mount(Parent);
    const input = () => wrapper.find('input').element as HTMLInputElement;
    expect(input().value).toBe('initial');

    await wrapper.find('input').setValue('changed');
    expect(outer.value).toEqual({ foo: 'changed' });
  });

});

// ─── field.isEmpty ───────────────────────────────────────────────────────────
//
// FieldWrapper uses field.isEmpty to decide whether to show the noValueLabel in view mode.
// The default test runs on the coerced value; a field can supply its own via the options.

describe('field.isEmpty', () => {
  // A minimal field that coerces nothing and just prints its emptiness
  const makeProbe = (opts?: UseFormFieldOptions<FormValue>) => defineComponent({
    props: { modelValue: { type: null, default: undefined } },
    emits: ['update:modelValue', 'update:errors'],
    setup(props, { emit }) {
      const { field } = useFormField<FormValue>(
        coerceToFormValue,
        emit as FieldEmitType<FormValue>,
        toRefs(props) as RefsOf<FieldProps>,
        opts,
      );
      return () => h('span', field.value.isEmpty ? 'EMPTY' : 'FULL');
    },
  });

  test.each([
    { label: 'null',         value: null,  expected: 'EMPTY' },
    { label: 'empty string', value: '',    expected: 'EMPTY' },
    { label: 'empty array',  value: [],    expected: 'EMPTY' },
    { label: 'zero',         value: 0,     expected: 'FULL'  },
    { label: 'false',        value: false, expected: 'FULL'  },
    { label: 'a string',     value: 'x',   expected: 'FULL'  },
    { label: 'an array',     value: ['x'], expected: 'FULL'  },
    { label: 'an object',    value: {},    expected: 'FULL'  },
  ])('$label is $expected by default', ({ value, expected }) => {
    const wrapper = mount(makeProbe(), { props: { modelValue: value } });
    expect(wrapper.text()).toBe(expected);
  });

  test('an isEmpty option replaces the default test', () => {
    const Probe = makeProbe({ isEmpty: (val) => val === 'nothing' });
    expect(mount(Probe, { props: { modelValue: 'nothing' } }).text()).toBe('EMPTY');
    expect(mount(Probe, { props: { modelValue: '' } }).text()).toBe('FULL');
  });
});

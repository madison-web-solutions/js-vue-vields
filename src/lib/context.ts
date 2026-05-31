import type { Ref, WritableComputedRef, InjectionKey } from "vue";
import type { FormValue, MessageBag } from "../types";
import { computed, inject, provide, watchEffect } from "vue";
import injectionSymbols from "./injection-symbols";
import { valueAt, setValueAt } from "./type-utils";
import { sliceMessageBag, spliceMessageBag } from "./message-bag";

// Warn (once per field) about a name/index that doesn't make sense. The two cases are
// mutually exclusive:
//  - an *owner* (its own v-model) with a name/index: contradictory — v-model makes the field
//    own its value, so the name/index is meaningless and ignored.
//  - a *non-owner* with a name/index inside a non-null scalar parent: mis-keyed — you cannot
//    have a named/indexed sub-field of a string or number (the classic mistake of keying a
//    field that represents a whole value, e.g. a simple RepeaterField row already wrapped by
//    FieldArrayItem). Empty ({}/null) and collection parents are fine.
const checkNameOrIndex = (
  nameOrIndex: Ref<string | number | undefined>,
  isOwner: Ref<boolean>,
  parentValue: Ref<FormValue> | undefined
): void => {
  let warned = false;
  watchEffect(() => {
    if (warned || nameOrIndex.value == null) {
      return;
    }
    if (isOwner.value) {
      warned = true;
      console.warn(
        `[vue-fields-ms] A field has both an explicit v-model and a name/index ("${nameOrIndex.value}"). ` +
          `v-model makes the field own its value, so the name/index is contradictory and is ignored. ` +
          `Use v-model to own the value, or a name/index to bind into the surrounding context — not both ` +
          `(to feed in errors, pass them via v-model:errors).`
      );
      return;
    }
    const value = parentValue?.value;
    if (value != null && typeof value !== "object") {
      warned = true;
      console.warn(
        `[vue-fields-ms] A field keyed "${nameOrIndex.value}" is bound inside a value that is ` +
          `not a collection (${typeof value}: ${JSON.stringify(value)}). A field that represents an ` +
          `entire value — e.g. the row of a simple RepeaterField, which FieldArrayItem already ` +
          `provides — must be keyless. Remove its name/index, or check the surrounding data shape.`
      );
    }
  });
};

// The data-binding core. Binding is strictly *per level*: every container provides its
// value (and its errors) to its descendants, and a child addresses that parent value by a
// single key — its `name` (a string ⟹ an object) or `index` (a number ⟹ an array), or, when
// keyless, the whole parent value. There is no multi-segment addressing here; the only real
// paths in the library are the display path (useExtendsPath → input `name`) and the relative
// query in getCurrentValue.

/**
 * Describes how to read/write a backing store of type T at a single `nameOrIndex`. The two
 * instances below are the only ones: the value tree and the (flat, dotted-key) errors bag.
 * A `nameOrIndex` of `undefined` means "the whole provided value" (a keyless field).
 */
export type ContextAccessStrategy<T> = {
  symbol: InjectionKey<Ref<T> | undefined>;
  read: (parentValue: T, nameOrIndex: string | number | undefined) => T;
  write: (parentValue: T, nameOrIndex: string | number | undefined, value: T) => T;
  empty: T;
};

// How a field reads/writes its value within its parent's provided value (FormValue).
export const formValueStrategy: ContextAccessStrategy<FormValue> = {
  symbol: injectionSymbols.parentValue,
  read: (parentValue, nameOrIndex) =>
    nameOrIndex == null ? parentValue : valueAt(parentValue, nameOrIndex),
  write: (parentValue, nameOrIndex, value) =>
    nameOrIndex == null ? value : setValueAt(parentValue, nameOrIndex, value),
  empty: undefined,
};

// How a field reads/writes its errors within its parent's provided errors (MessageBag).
export const formErrorsStrategy: ContextAccessStrategy<MessageBag> = {
  symbol: injectionSymbols.parentErrors,
  read: (parentErrors, nameOrIndex) =>
    sliceMessageBag(parentErrors, nameOrIndex == null ? "" : String(nameOrIndex)),
  write: (parentErrors, nameOrIndex, value) =>
    spliceMessageBag(parentErrors, nameOrIndex == null ? "" : String(nameOrIndex), value),
  empty: {},
};

/**
 * A writable, reactive ref to the child of `parentValue` at `nameOrIndex`. Reading returns the
 * value at that key; writing splices a new value back into the parent immutably. When there is
 * no parent value the ref reads as empty and writes are no-ops. The single primitive behind
 * useFieldBinding (a field focusing its own key) and FieldArrayItem (a row focusing its index).
 */
export const refOfChildAt = <T extends FormValue | MessageBag>(
  strategy: ContextAccessStrategy<T>,
  parentValue: Ref<T> | undefined,
  nameOrIndex: Ref<string | number | undefined>
): WritableComputedRef<T> => {
  return computed({
    get: (): T =>
      parentValue == null
        ? strategy.empty
        : strategy.read(parentValue.value, nameOrIndex.value),
    set: (value: T) => {
      if (parentValue != null) {
        parentValue.value = strategy.write(parentValue.value, nameOrIndex.value, value);
      }
    },
  });
};

/**
 * Resolve where a field's value (or errors) lives and return a single two-way ref to it. When
 * `isOwner` is true the field owns this slot: the ref reads its explicit binding (its own
 * v-model) and emits on change, ignoring any parent context. Otherwise the ref is a view of the
 * parent value at the field's own key, and a field with no parent context falls back to emitting
 * (a standalone, context-less field). useFormField calls it twice — once per strategy — to get
 * the field's `value` ref and its `errors` ref.
 */
export const useFieldBinding = <T extends FormValue | MessageBag>(
  strategy: ContextAccessStrategy<T>,
  nameOrIndex: Ref<string | number | undefined>,
  isOwner: Ref<boolean>,
  getExplicit: () => unknown,
  emitUpdate: (value: T) => void
): WritableComputedRef<T> => {
  const parentValue = inject(strategy.symbol, undefined);
  const focused = refOfChildAt(strategy, parentValue, nameOrIndex);

  if (strategy.symbol === injectionSymbols.parentValue) {
    checkNameOrIndex(nameOrIndex, isOwner, parentValue as Ref<FormValue> | undefined);
  }

  return computed({
    get: (): T => {
      return isOwner.value ? (getExplicit() as T) : focused.value;
    },
    set: (value: T) => {
      if (isOwner.value || parentValue == null) {
        emitUpdate(value);
      } else {
        focused.value = value;
      }
    },
  });
};

/**
 * Provide this container's value/errors as the form values its descendant fields bind into.
 * Replaces the per-shape lens objects the container fields used to construct and provide.
 */
export const provideFormValues = (
  value: Ref<FormValue>,
  errors: Ref<MessageBag>
): void => {
  provide(injectionSymbols.parentValue, value);
  provide(injectionSymbols.parentErrors, errors);
};

/**
 * Re-provide the surrounding form values focused at `nameOrIndex` — narrow the context to a
 * single child so that child's contents bind into it. The structural counterpart to
 * provideFormValues; used by FieldArrayItem to scope a repeater row by its index.
 */
export const provideFormValuesAt = (
  nameOrIndex: Ref<string | number | undefined>
): void => {
  const parentValue = inject(injectionSymbols.parentValue, undefined);
  const parentErrors = inject(injectionSymbols.parentErrors, undefined);
  provideFormValues(
    refOfChildAt(formValueStrategy, parentValue, nameOrIndex),
    refOfChildAt(formErrorsStrategy, parentErrors, nameOrIndex)
  );
};

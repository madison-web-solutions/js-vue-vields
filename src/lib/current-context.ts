import type { ComputedRef } from "vue";
import type { FormValue, MessageBag, Path } from "../types";
import { computed, inject } from "vue";
import injectionSymbols from "./injection-symbols";
import { valueAtPath } from "./type-utils";
import { sliceMessageBag } from "./message-bag";

// These helpers let a component read the value/errors of its surrounding data
// context — the value/errors a container (FieldGroup, RepeaterField, …) provides
// to its descendants. They're for components authored to be dropped *inside* a
// container, which don't own the data themselves. The component that mounts the
// container and owns the v-model has no need for them.
//
// Unlike a field (which steps a single key into its parent value), these accept a
// `path` — a dotted relative query like "address.city" — so this is the one place
// in the library that genuinely reads a multi-segment path (via valueAtPath).
//
// Both return a ComputedRef so the result tracks changes. They must be called
// during setup() (like a composable) because they inject the surrounding context.

// Split a dotted path string ("address.city") into a Path, matching the library's
// pathString convention. An omitted/empty path means the whole current value.
const splitPath = (path?: string): Path => {
  return path == null || path === "" ? [] : path.split(".");
};

/**
 * Read the value at `path` (a dotted string, relative to the surrounding container
 * context), as a reactive ComputedRef. Omit `path` to get the whole current value.
 * Returns undefined when there is no container context or the path doesn't exist.
 */
export const getCurrentValue = (path?: string): ComputedRef<FormValue> => {
  const parentValue = inject(injectionSymbols.parentValue, undefined);
  return computed((): FormValue => {
    return parentValue == null ? undefined : valueAtPath(parentValue.value, splitPath(path));
  });
};

/**
 * Read the errors at `path` (a dotted string, relative to the surrounding container
 * context), as a reactive ComputedRef. The returned MessageBag is scoped exactly as
 * the matching field would see it: the field's own messages under the "" key, with
 * any nested sub-field errors below. Omit `path` to get the whole current bag.
 * Returns {} when there is no container context.
 */
export const getCurrentErrors = (path?: string): ComputedRef<MessageBag> => {
  const parentErrors = inject(injectionSymbols.parentErrors, undefined);
  return computed((): MessageBag => {
    return parentErrors == null ? {} : sliceMessageBag(parentErrors.value, path ?? "");
  });
};

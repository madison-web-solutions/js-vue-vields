import type { ComputedRef } from "vue";
import type { FormValue, MessageBag, Path } from "../types";
import { computed, inject } from "vue";
import injectionSymbols from "./injection-symbols";
import { valueAtPath } from "./type-utils";
import { sliceMessageBag } from "./message-bag";

// These helpers let a component read the value/errors of its surrounding data
// context — the value/errors a container (FieldGroup, RepeaterField, …) provides
// to its descendants via the injected lens. They're for components authored to be
// dropped *inside* a container, which don't own the data themselves. The component
// that mounts the container and owns the v-model has no need for them.
//
// Both return a ComputedRef so the result tracks changes. They must be called
// during setup() (like a composable) because they inject the lens context.

// Split a dotted path string ("address.city") into a Path, matching the library's
// pathString convention. An omitted/empty path means the whole current context.
const splitPath = (path?: string): Path => {
  return path == null || path === "" ? [] : path.split(".");
};

// Re-flatten a grouped error bag (as returned by a named/indexed errors lens's
// getAll()) back into a single MessageBag with dotted keys — the inverse of the
// grouping done in useHasCompoundValue / useRepeaterField. Object.entries handles
// both the Record (named) and array (indexed) shapes uniformly.
const flattenErrorBag = (
  grouped: Record<string, MessageBag> | MessageBag[]
): MessageBag => {
  const out: MessageBag = {};
  for (const [prefix, subBag] of Object.entries(grouped)) {
    for (const key in subBag) {
      out[key === "" ? prefix : `${prefix}.${key}`] = subBag[key];
    }
  }
  return out;
};

/**
 * Read the value at `path` (a dotted string, relative to the surrounding container
 * context), as a reactive ComputedRef. Omit `path` to get the whole current value.
 * Returns undefined when there is no container context or the path doesn't exist.
 */
export const getCurrentValue = (path?: string): ComputedRef<FormValue> => {
  const valueLens = inject(injectionSymbols.valueLens, undefined);
  return computed((): FormValue => {
    const root: FormValue =
      valueLens == null
        ? undefined
        : valueLens.lensType === "fixed"
          ? valueLens.get()
          : valueLens.getAll();
    return valueAtPath(root, splitPath(path));
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
  const errorsLens = inject(injectionSymbols.errorsLens, undefined);
  return computed((): MessageBag => {
    const root: MessageBag =
      errorsLens == null
        ? {}
        : errorsLens.lensType === "fixed"
          ? errorsLens.get()
          : flattenErrorBag(errorsLens.getAll());
    return sliceMessageBag(root, path ?? "");
  });
};

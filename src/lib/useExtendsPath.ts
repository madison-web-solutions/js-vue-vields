import type { Ref } from "vue";
import type { Path } from "../types";
import { computed, inject, provide } from "vue";
import injectionSymbols from "./injection-symbols";

/**
 * Composable that causes the component to
 *  - inject the parent path
 *  - add on it's own path component
 *  - provide the extended path to children
 *
 * When `resetParent.value` is true, the ancestor path is dropped — the field
 * is the root of its own context. Used when an explicit v-model on a field
 * overrides any ancestor lens (see useFormField).
 */
export default function useExtendsPath(
  nameOrIndex: Ref<string | number | undefined> | undefined,
  resetParent?: Ref<boolean>,
) {
  const parentPath = inject(injectionSymbols.path, undefined);

  const path = computed((): Path => {
    // Levels without a name/index (e.g. FieldGroup) must pass the parent path through
    // unchanged rather than resetting it, so nested fields keep their fully-qualified path.
    const base = resetParent?.value ? [] : (parentPath?.value ?? []);
    return nameOrIndex?.value == null ? base : base.concat(nameOrIndex.value);
  });

  const pathString = computed((): string => {
    return path.value.join(".");
  });

  provide(injectionSymbols.path, path);

  return { path, pathString };
}

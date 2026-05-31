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
 * The path mirrors the value's location from its nearest root, so pathString matches
 * the value being edited (it is what fields render as the input `name`).
 *
 * When `resetParent.value` is true the field has its own v-model: it owns its value and
 * becomes a fresh root, so the ancestor path is dropped AND the field's own name/index is
 * ignored (an explicit v-model and a name/index are contradictory — see useFormField).
 */
export default function useExtendsPath(
  nameOrIndex: Ref<string | number | undefined> | undefined,
  resetParent?: Ref<boolean>,
) {
  const parentPath = inject(injectionSymbols.path, undefined);

  const path = computed((): Path => {
    // A v-model'd field is the root of a fresh context; its own name/index is meaningless
    // there, so the path resets to [] and descendants address the new value from scratch.
    if (resetParent?.value) {
      return [];
    }
    // Levels without a name/index (e.g. FieldGroup) must pass the parent path through
    // unchanged rather than resetting it, so nested fields keep their fully-qualified path.
    const base = parentPath?.value ?? [];
    return nameOrIndex?.value == null ? base : base.concat(nameOrIndex.value);
  });

  const pathString = computed((): string => {
    return path.value.join(".");
  });

  provide(injectionSymbols.path, path);

  return { path, pathString };
}

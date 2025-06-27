import type { Ref } from "vue";
import type { Path } from "../types";
import { computed, inject, provide } from "vue";
import injectionSymbols from "./injection-symbols";

/**
 * Composable that causes the component to
 *  - inject the parent path
 *  - add on it's own path component
 *  - provide the extended path to children
 */
export default function useExtendsPath(
  nameOrIndex: Ref<string | number | undefined> | undefined
) {
  const parentPath = inject(injectionSymbols.path, undefined);

  const path = computed((): Path => {
    if (nameOrIndex?.value == null) {
      return [];
    } else {
      if (parentPath) {
        return parentPath.value.concat(nameOrIndex.value);
      } else {
        return [nameOrIndex.value];
      }
    }
  });

  const pathString = computed((): string => {
    return path.value.join(".");
  });

  provide(injectionSymbols.path, path);

  return { path, pathString };
}

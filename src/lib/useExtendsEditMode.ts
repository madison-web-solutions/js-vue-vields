import type { Ref } from "vue";
import { inject, provide, computed } from "vue";
import type { EditMode } from "../types";
import injectionSymbols from "./injection-symbols";

export default function useExtendsEditMode(editModeProp: Ref<EditMode | undefined> | undefined): Ref<EditMode> {
  const injectedEditMode = inject(injectionSymbols.editMode, undefined);

  const editMode = computed((): EditMode => {
    return editModeProp?.value || injectedEditMode?.value || "edit";
  });

  provide(injectionSymbols.editMode, editMode);

  return editMode;
};

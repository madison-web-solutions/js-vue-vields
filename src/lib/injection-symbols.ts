import type { Ref, InjectionKey } from "vue";
import type { Path, Lens, FormValue, MessageBag, EditMode, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider, Config } from "../types";
import type FieldWrapper from "../components/FieldWrapper.vue";

const symbols = {
  config: Symbol('vfm-config') as InjectionKey<Ref<Config>>,
  editMode: Symbol('vfm-edit-mode') as InjectionKey<Ref<EditMode>>,
  path: Symbol('vfm-path') as InjectionKey<Ref<Path> | undefined>,
  valueLens: Symbol('vfm-value-lens') as InjectionKey<Lens<FormValue>>,
  errorsLens: Symbol('vfm-errors-lens') as InjectionKey<Lens<MessageBag>>,
  choicesProvider: Symbol('vfm-choices-provider') as InjectionKey<ChoicesProvider | undefined>,
  linksProvider: Symbol('vfm-links-provider') as InjectionKey<LinksProvider | undefined>,
  mediaProvider: Symbol('vfm-media-provider') as InjectionKey<MediaProvider | undefined>,
  passwordStrengthProvider: Symbol('vfm-password-strength-provider') as InjectionKey<PasswordStrengthProvider | undefined>,
  fieldWrapperComponent: Symbol('vfm-field-wrapper-component') as InjectionKey<typeof FieldWrapper | undefined>,
} as const;
Object.freeze(symbols);
export default symbols;

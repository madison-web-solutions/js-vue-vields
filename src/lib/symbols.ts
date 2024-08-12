import type {
  Config,
  ChoicesProvider,
  FormValue,
  Lens,
  LinksProvider,
  MediaProvider,
  MessageBag,
  PasswordStrengthProvider,
  Path,
} from "../main";
import type { Ref, InjectionKey } from "vue";
import { FieldWrapper } from "../main";

const symbols = {
  editMode: Symbol() as InjectionKey<Ref<"edit" | "view">>,
  noValueLabel: Symbol() as InjectionKey<Ref<string>>,
  path: Symbol() as InjectionKey<Ref<Path> | undefined>,
  valueLens: Symbol() as InjectionKey<Lens<FormValue>>,
  errorsLens: Symbol() as InjectionKey<Lens<MessageBag>>,
  choicesProvider: Symbol() as InjectionKey<Ref<ChoicesProvider> | undefined>,
  linksProvider: Symbol() as InjectionKey<Ref<LinksProvider> | undefined>,
  mediaProvider: Symbol() as InjectionKey<Ref<MediaProvider> | undefined>,
  passwordStrengthProvider: Symbol() as InjectionKey<
    Ref<PasswordStrengthProvider> | undefined
  >,
  fieldWrapperComponent: Symbol() as InjectionKey<
    typeof FieldWrapper | undefined
  >,
  config: Symbol() as InjectionKey<Ref<Partial<Config>> | undefined>,
  htmlEditorLock: Symbol(),
};
Object.freeze(symbols);
export { symbols };

import type { Ref, InjectionKey } from "vue";
import type { Path, Lens, FormValue, MessageBag, EditMode, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider, Config } from "../types";
import { link } from "fs";

const symbols = {
  config: Symbol() as InjectionKey<Ref<Config>>,
  editMode: Symbol() as InjectionKey<Ref<EditMode>>,
  path: Symbol() as InjectionKey<Ref<Path> | undefined>,
  valueLens: Symbol() as InjectionKey<Lens<FormValue>>,
  errorsLens: Symbol() as InjectionKey<Lens<MessageBag>>,
  choicesProvider: Symbol() as InjectionKey<ChoicesProvider | undefined>,
  linksProvider: Symbol() as InjectionKey<LinksProvider | undefined>,
  mediaProvider: Symbol() as InjectionKey<MediaProvider | undefined>,
  passwordStrengthProvider: Symbol() as InjectionKey<PasswordStrengthProvider | undefined>,
} as const;
Object.freeze(symbols);
export default symbols;

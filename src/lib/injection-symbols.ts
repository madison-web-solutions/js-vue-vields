import type { Ref, InjectionKey } from "vue";
import type { Path, Lens, FormValue, MessageBag, EditMode, ChoicesProvider, PasswordStrengthProvider, Config } from "../types";

const symbols = {
  config: Symbol() as InjectionKey<Ref<Config>>,
  editMode: Symbol() as InjectionKey<Ref<EditMode>>,
  path: Symbol() as InjectionKey<Ref<Path> | undefined>,
  valueLens: Symbol() as InjectionKey<Lens<FormValue>>,
  errorsLens: Symbol() as InjectionKey<Lens<MessageBag>>,
  choicesProvider: Symbol() as InjectionKey<ChoicesProvider | undefined>,
  passwordStrengthProvider: Symbol() as InjectionKey<PasswordStrengthProvider | undefined>,
};
Object.freeze(symbols);
export default symbols;

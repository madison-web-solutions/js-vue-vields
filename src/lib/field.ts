import type { Ref, PropType } from 'vue';
import type { MessageBag, Path, FormValue, Choosable } from '@/main';
import { computed, provide, inject, ref, watchEffect } from 'vue';
import { getUniqueKey, sliceMessageBag, reindexErrors, symbols } from '@/main';
import { startCase } from '@/lib/util';

export const commonProps = {
    modelValue: {},
    label: {
        type: String,
    },
    required: {
        type: Boolean,
        default: false,
    },
    disabled: {
        type: Boolean,
        default: false,
    },
    help: {
        type: String,
    },
    placeholder: {
        type: String,
    },
    errors: {
        type: Object as PropType<MessageBag>,
    },
    name: {
        type: [String, Number],
    }
};

// Composable that causes the component to
//  - inject the parent path
//  - add on it's own path component
//  - provide the extended path to children
export const useExtendsPath = (nameOrIndex: Ref<string | number | undefined> | undefined) => {

    const parentPath = inject(symbols.path, undefined);

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
        return path.value.join('.');
    });

    provide(symbols.path, path);

    return { path, pathString };
};

type UseFormFieldPropRefs<ValueType> = {
    modelValue?: Ref<unknown>,
    errors?: Ref<MessageBag | undefined>,
    name?: Ref<string | number | undefined>,
};

type FieldEmitType<ValueType> = {
    (e: 'update:modelValue', value: ValueType): void
    (e: 'update:errors', value: MessageBag): void
};

export function useFormField<ValueType extends FormValue> (valueCoerceFn: (val: unknown) => ValueType, emit: FieldEmitType<ValueType>, propRefs: UseFormFieldPropRefs<ValueType>) {

    const name = computed((): (string | number | undefined) => {
        return propRefs?.name?.value;
    });

    const { path, pathString } = useExtendsPath(propRefs.name);

    const inputEleId = ref(getUniqueKey());

    const injectedModelValue = inject(symbols.modelValue, undefined);

    const rawValue = computed((): unknown => {
        if (name.value == null) {
            return propRefs?.modelValue?.value;
        } else {
            return (injectedModelValue && injectedModelValue.value) ? (injectedModelValue.value as any)[name.value] : undefined;
        }
    });

    const setter = inject(symbols.setter, undefined);

    const modelValue = computed({
        get: (): ValueType => {
            return valueCoerceFn(rawValue.value);
        },
        set: (newValue: ValueType): void => {
            if (name.value == null) {
                emit('update:modelValue', newValue);
            } else {
                if (setter && setter.value) {
                    setter.value(newValue, name.value);
                }
            }
        }
    });

    provide(symbols.modelValue, modelValue);

    const injectedErrors = inject(symbols.errors, undefined);
    const errorsSetter = inject(symbols.errorsSetter, undefined);

    const errors = computed({
        get: (): MessageBag => {
            if (name.value == null) {
                return propRefs?.errors?.value || {};
            } else {
                if (injectedErrors && injectedErrors.value) {
                    return sliceMessageBag(injectedErrors.value, String(name.value));
                } else {
                    return {};
                }
            }
        },
        set: (newErrors: MessageBag) => {
            if (name.value == null) {
                emit('update:errors', newErrors);
            } else {
                if (errorsSetter && errorsSetter.value) {
                    errorsSetter.value(newErrors, name.value);
                }
            }
        }
    });

    const myErrors = computed((): string[] => {
        return errors.value[''] || [];
    });

    const hasError = computed((): boolean => {
        return myErrors.value.length > 0;
    });

    provide(symbols.errors, errors);

    const editMode = inject(symbols.editMode, ref('edit'));

    return { inputEleId, path, pathString, rawValue, modelValue, errors, myErrors, hasError, editMode };
};

export type BooleansMap = {[key: string]: boolean};
export type KeysList = (string | number)[];

type UseHasChoicePropRefs = {
    directory?: Ref<string | undefined>,
    choices?: Ref<string | object | undefined>,
    extraParams?: Ref<object | undefined>,
};

export const useHasChoices = (props: UseHasChoicePropRefs) => {

    const { directory, choices, extraParams } = props;

    const provider = inject(symbols.choicesProvider, undefined);

    const directoryChoices = ref<Choosable[]>([]);
    
    watchEffect(() => {
        if (directory != null && directory.value != null) {
            if (provider != null && provider.value != null) {
                provider.value.getAll(directory.value, extraParams?.value || {}).then((choiceListResult) => {
                    if (choiceListResult.status == 'found') {
                        directoryChoices.value = choiceListResult.resource;
                    } else {
                        directoryChoices.value = [];
                    }
                });
            } else {
                console.log("Warning, directory " + directory.value + " specified in field but there is no choice list provider");
                directoryChoices.value = [];
            }
        }
    });

    const isPartialChoosable = (obj: any): obj is {key: string, label?: unknown} => {
        return typeof obj == 'object' && obj != null && 'key' in obj && typeof obj.key == 'string';
    };

    const choicesNormalized = computed((): Choosable[] => {
        if (directory != null && directory.value != null) {
            // Directory is specified, so use the set of choices from the provider
            return directoryChoices.value;
        }
        // Directory is not specified, so the set of choices should be specified as a prop instead
        const out: Choosable[] = [];
        if (choices == null || choices.value == null) {
            // No options
        } else if (Array.isArray(choices.value)) {
            for (const choice of choices.value) {
                if (typeof choice == 'string') {
                    out.push({key: choice, label: startCase(choice)});
                } else if (isPartialChoosable(choice)) {
                    out.push({
                        key: choice.key,
                        label: ((typeof choice.label == 'string') ? choice.label : startCase(choice.key))
                    });
                } else {
                    console.log(choices.value);
                    throw "Invalid choice specification";
                }
            }
        } else if (typeof choices.value == 'object') {
            // Assume object keys are option values and object values are option labels
            for (const [key, label] of Object.entries(choices.value)) {
                out.push({
                    key: String(key),
                    label: String(label)
                });
            }
        } else if (typeof choices.value == 'string') {
            choices.value.split(',').forEach((key) => {
                out.push({key: key.trim(), label: startCase(key)});
            });
        }
        return out;
    });
    
    const possibleValues = computed((): (string | number)[] => {
        return choicesNormalized.value.map(choice => choice.key);
    });

    return { choicesNormalized, possibleValues };
};


export const useHasChoicesSingle = (modelValue: Ref<string | number | undefined>, props: UseHasChoicePropRefs) => {

    const { choicesNormalized, possibleValues } = useHasChoices(props);

    const currentChoice = computed((): Choosable | null => {
        for (const choice of choicesNormalized.value) {
            if (choice.key == modelValue.value) {
                return choice;
            }
        }
        return null;
    });
    
    const nullSelected = computed(() => {
        return modelValue.value == null || possibleValues.value.includes(modelValue.value);
    });

    return { choicesNormalized, currentChoice, possibleValues, nullSelected };
};


export const useHasChoicesMultiple = (modelValue: Ref<KeysList>, errors: Ref<MessageBag>, props: UseHasChoicePropRefs) => {

    const { choicesNormalized, possibleValues } = useHasChoices(props);

    const subValues = computed((): BooleansMap => {
        const out: BooleansMap = {};
        choicesNormalized.value.forEach((choice) => {
            out[String(choice.key)] = modelValue.value.includes(choice.key);
        });
        return out;
    });

    const toggle = (key: string | number): void => {
        const newValue = modelValue.value.slice();
        if (newValue.includes(key)) {
            // This key is being turned off
            const index = newValue.indexOf(key);
            newValue.splice(index, 1);
            // We'll also need to shift error message indexes
            errors.value = reindexErrors(errors.value, (oldIndex) => {
                if (oldIndex === index) {
                    // errors from the deleted key should be discarded
                    return undefined;
                } else if (oldIndex > index) {
                    // errors from keys after the deleted one will shift backwards one position
                    return oldIndex - 1;
                } else {
                    return oldIndex;
                }
            });
        } else {
            // This key is being turned on
            newValue.push(key);
        }
        modelValue.value = newValue;
    };
    
    const subErrors = computed((): MessageBag => {
        const out: MessageBag = {};
        choicesNormalized.value.forEach((choice) => {
            const index = modelValue.value.indexOf(choice.key);
            if (index == -1) {
                out[choice.key] = [];
            } else {
                out[choice.key] = errors.value[String(index)] || [];
            }
        });
        return out;
    });
    
    const hasSubErrors = computed((): BooleansMap => {
        const out: BooleansMap = {};
        choicesNormalized.value.forEach((choice) => {
            out[choice.key] = subErrors.value[choice.key].length > 0;
        });
        return out;
    });

    return { choicesNormalized, possibleValues, subValues, toggle, subErrors, hasSubErrors };
};

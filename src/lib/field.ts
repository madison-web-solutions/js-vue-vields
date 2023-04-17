import type { Ref, PropType } from 'vue';
import type {
    BooleansMap,
    Choosable,
    CompoundFormValue,
    Config,
    EditMode,
    FieldEmitType,
    FormValue,
    KeysList,
    MessageBag,
    NamedLens,
    ParsesTextFieldOptions,
    Path,
    UseFormFieldOpts,
    UseFormFieldPropRefs,
    UseFormFieldHasChoicesMultiplePropRefs,
    UseHasChoicesPropRefs,
} from '@/main';
import { FieldWrapper as StandardFieldWrapper } from '@/main';
import { computed, provide, inject, ref, watchEffect, onBeforeMount, nextTick } from 'vue';
import { getUniqueKey, sliceMessageBag, spliceMessageBag, coerceToBooleansNativeMap, coerceToKeysList, copyCompoundFormValue, reindexErrors, symbols } from '@/main';
import { startCase } from '@/lib/util';

export const commonProps = {
    modelValue: {},
    label: {
        type: String,
    },
    required: {
        type: Boolean,
    },
    disabled: {
        type: Boolean,
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
        type: String,
    },
    fieldTypeSlug: {
        type: String,
    },
    editMode: {
        type: String as PropType<EditMode>,
    },
    default: {
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
            if (parentPath) {
                return parentPath.value;
            } else {
                return [];
            }
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

const defaultCheckQueue: ({rawValue: Ref<unknown>, defaultProp: Ref<unknown>, setter: (val: unknown) => void})[] = [];
let doingDefaultChecks: boolean = false;
const doNextDefaultCheck = async () => {
    if (doingDefaultChecks) {
        return;
    }
    doingDefaultChecks = true;
    await nextTick();
    while (defaultCheckQueue.length > 0) {
        const next = defaultCheckQueue.shift();
        if (! next) {
            break;
        }
        const { rawValue, defaultProp, setter } = next;
        if (rawValue.value == null && defaultProp.value != null) {
            setter(next.defaultProp.value);
            await nextTick();
        }
    }
    doingDefaultChecks = false;
};
const queueDefaultCheck = <ValueType extends FormValue>(rawValue: Ref<unknown>, defaultProp: Ref<unknown>, setter: (val: unknown) => void) => {
    defaultCheckQueue.push({ rawValue, defaultProp, setter });
    doNextDefaultCheck();
};

export function useFormField<ValueType extends FormValue> (valueCoerceFn: (val: unknown) => ValueType, emit: FieldEmitType<ValueType>, propRefs: UseFormFieldPropRefs<ValueType>, opts?: UseFormFieldOpts) {

    const name = computed((): (string | undefined) => {
        return propRefs.name?.value;
    });
    const index = computed((): (number | undefined) => {
        return propRefs.index?.value;
    });
    const nameOrIndex = computed((): (string | number | undefined) => {
        if (propRefs.name?.value != null) {
            return propRefs.name.value;
        }
        if (propRefs.index?.value != null) {
            return propRefs.index.value;
        }
        return undefined;
    });

    const { path, pathString } = useExtendsPath(nameOrIndex);

    const inputEleId = ref(getUniqueKey());

    const valueLens = inject(symbols.valueLens, undefined);

    // @todo
    // Warn of ambiguities about the data bindings from incorrect use
    // For example if there's both a v-model and a name, or an indexedLens with no index, etc

    const rawValue = computed(() => {
        if (valueLens && valueLens.lensType == 'fixed') {
            return valueLens.get();
        }
        if (name.value && valueLens && valueLens.lensType == 'named') {
            return valueLens.get(name.value);
        }
        if (index.value != null && valueLens && valueLens.lensType == 'indexed') {
            return valueLens.get(index.value);
        }
        return propRefs?.modelValue?.value;;
    });

    const setNewValue = (newVal: ValueType) => {
        if (valueLens && valueLens.lensType == 'fixed') {
            valueLens.set(newVal);
        } else if (name.value && valueLens && valueLens.lensType == 'named') {
            valueLens.set(name.value, newVal);
        } else if (index.value != null && valueLens && valueLens.lensType == 'indexed') {
            valueLens.set(index.value, newVal);
        } else {
            emit('update:modelValue', newVal);
        }
    };

    const modelValue = computed({
        get: (): ValueType => {
            return valueCoerceFn(rawValue.value);
        },
        set: (newVal: ValueType) => {
            setNewValue(newVal);
        }
    });

    onBeforeMount(() => {
        if (propRefs.default) {
            queueDefaultCheck(rawValue, propRefs.default, (val: unknown) => setNewValue(valueCoerceFn(val)));
        }
    });

    const errorsLens = inject(symbols.errorsLens, undefined);

    // All error messages for this field and any nested subfields
    const errors = computed({
        get: (): MessageBag => {
            if (errorsLens && errorsLens.lensType == 'fixed') {
                return errorsLens.get();
            }
            if (name.value && errorsLens && errorsLens.lensType == 'named') {
                return errorsLens.get(name.value);
            }
            if (index.value != null && errorsLens && errorsLens.lensType == 'indexed') {
                return errorsLens.get(index.value);
            }
            return propRefs?.errors?.value || {};
        },
        set: (newErrors: MessageBag) => {
            if (errorsLens && errorsLens.lensType == 'fixed') {
                errorsLens.set(newErrors);
            } else if (name.value && errorsLens && errorsLens.lensType == 'named') {
                errorsLens.set(name.value, newErrors);
            } else if (index.value != null && errorsLens && errorsLens.lensType == 'indexed') {
                errorsLens.set(index.value, newErrors);
            } else {
                emit('update:errors', newErrors);
            }
        }
    });

    // Error messages specifically for this field
    const myErrors = computed((): string[] => {
        return errors.value[''] || [];
    });

    const hasError = computed((): boolean => {
        return myErrors.value.length > 0;
    });

    const injectedEditMode = inject(symbols.editMode, undefined);
    const editMode = computed((): EditMode => {
        return propRefs.editMode?.value || injectedEditMode?.value || 'edit';
    });

    const FieldWrapper = inject(symbols.fieldWrapperComponent) || StandardFieldWrapper;

    const fieldTypeSlug = computed((): string | undefined => {
        return propRefs?.fieldTypeSlug?.value || opts?.fieldTypeSlug || undefined;
    });

    const standardWrapperProps = computed(() => {
        return {
            inputEleId: inputEleId.value,
            label: propRefs?.label?.value,
            required: propRefs?.required?.value,
            help: propRefs?.help?.value,
            tooltip: propRefs?.tooltip?.value,
            modelValue: modelValue.value,
            errors: myErrors.value,
            fieldTypeSlug: fieldTypeSlug.value,
            path: path.value,
            editMode: editMode.value,
        };
    });

    return { inputEleId, path, pathString, rawValue, modelValue, errors, myErrors, hasError, editMode, FieldWrapper, standardWrapperProps };
};

export const useExtendsEditMode = (editModeProp:  Ref<EditMode | undefined> | undefined ): Ref<EditMode> => {

    const injectedEditMode = inject(symbols.editMode, undefined);

    const editMode = computed((): EditMode => {
        return editModeProp?.value || injectedEditMode?.value || 'edit';
    });

    provide(symbols.editMode, editMode);

    return editMode;

};

export const useExtendsConfig = (overrides: Ref<Partial<Config> | undefined> | undefined): Ref<Partial<Config>> => {

    const parentConfig = inject(symbols.config, undefined);

    const config = computed((): Partial<Config> => {
        return Object.assign({}, parentConfig?.value, overrides?.value);
    });

    provide(symbols.config, config);

    return config;
};

export const useHasCompoundValue = (modelValue: Ref<CompoundFormValue>, errors: Ref<MessageBag>) => {
    const valueLens: NamedLens<FormValue> = {
        lensType: 'named',
        get: (name: string): FormValue => {
            return modelValue.value ? modelValue.value[name] : undefined;
        },
        set: (name: string, newVal: FormValue) => {
            // make a copy of our value
            const modelValueCopy: CompoundFormValue = copyCompoundFormValue(modelValue.value);
            // set the new value
            modelValueCopy[name] = newVal;
            modelValue.value = modelValueCopy;
        },
    };

    provide(symbols.valueLens, valueLens);

    const errorsLens: NamedLens<MessageBag> = {
        lensType: 'named',
        get: (name: string): MessageBag => {
            return sliceMessageBag(errors.value, name);
        },
        set: (name: string, newSubErrors: MessageBag) => {
            errors.value = spliceMessageBag(errors.value, name, newSubErrors);
        }
    };

    provide(symbols.errorsLens, errorsLens);
};

export const useHasChoices = (props: UseHasChoicesPropRefs) => {

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

    const isPartialChoosable = (obj: any): obj is {key: string | number, label?: unknown} => {
        return typeof obj == 'object' && obj != null && 'key' in obj && (typeof obj.key == 'string' || typeof obj.key == 'number');
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
                    out.push(Object.assign({
                        label: ((typeof choice.label == 'string') ? choice.label : startCase(choice.key))
                    }, choice));
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


export const useHasChoicesSingle = (modelValue: Ref<string | number | undefined>, props: UseHasChoicesPropRefs) => {

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
        return modelValue.value == null || ! possibleValues.value.includes(modelValue.value);
    });

    return { choicesNormalized, currentChoice, possibleValues, nullSelected };
};

export function useFormFieldWithChoicesMultiple(emit: FieldEmitType<KeysList | BooleansMap>, propRefs: UseFormFieldHasChoicesMultiplePropRefs, opts?: UseFormFieldOpts) {

    const { choicesNormalized, possibleValues } = useHasChoices(propRefs);

    const valueIs = computed((): ("array" | "object") => {
        return propRefs.valueIs?.value || 'array';
    });

    const coerceToChoicesBooleansMap = (value: any): BooleansMap => {
        const partial = coerceToBooleansNativeMap(value);
        const out: BooleansMap = {};
        choicesNormalized.value.forEach((choice) => {
            const key = String(choice.key);
            out[key] = !! partial.get(key);
        });
        return out;
    };
    
    const coerceFn = (value: any): KeysList | BooleansMap => {
        if (valueIs.value == 'array') {
            return coerceToKeysList(value);
        } else {
            return coerceToChoicesBooleansMap(value);
        }
    };

    const { inputEleId, pathString, modelValue, errors, FieldWrapper, standardWrapperProps } = useFormField<KeysList | BooleansMap>(coerceFn, emit, propRefs, opts);

    const toggle = (key: string | number): void => {
        if (valueIs.value == 'array') {
            const newValue = coerceToKeysList(modelValue.value); // creates a copy
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
        } else {
            const newValue = coerceToChoicesBooleansMap(modelValue.value); // creates a copy
            newValue[key] = ! newValue[key];
            modelValue.value = newValue;
        }
    };

    const modelValueAsKeyList = computed(() => {
        return coerceToKeysList(modelValue.value);
    });
    
    const modelValueAsBooleansMap = computed(() => {
        return coerceToChoicesBooleansMap(modelValue.value);
    });
    
    const isOn = (key: string | number): boolean => {
        if (valueIs.value == 'array') {
            return modelValueAsKeyList.value.includes(key);
        } else {
            return !! modelValueAsBooleansMap.value[String(key)];
        }
    };
    
    const subErrors = computed((): MessageBag => {
        const out: MessageBag = {};
        if (valueIs.value == 'array') {
            // Then we should expect the errors to be indexed numerically
            choicesNormalized.value.forEach((choice) => {
                out[choice.key] = [];
            });
            coerceToKeysList(modelValue.value).forEach((key, index) => {
                out[key] = errors.value[index] || [];
            });
        } else {
            // Then we should expect the errors to be indexed by choice key
            choicesNormalized.value.forEach((choice) => {
                out[choice.key] = errors.value[choice.key] || [];
            });
        }
        return out;
    });
    
    const hasSubErrors = (key: string | number): boolean => {
        const errors = subErrors.value[String(key)] || [];
        return errors.length > 0;
    };    

    return {
        choicesNormalized,
        possibleValues,
        valueIs,
        inputEleId,
        pathString,
        modelValue,
        errors,
        FieldWrapper,
        standardWrapperProps,
        toggle,
        isOn,
        subErrors,
        hasSubErrors,
    };
};

export function useParsesTextField<T>(modelValue: Ref<T | undefined>, inputEle: Ref<HTMLInputElement | null>, opts: ParsesTextFieldOptions<T>) {

    const tempClear = ref<boolean>(false);
    const focused = ref<boolean>(false);
    const onFocus = () => {
        focused.value = true;
    };
    const onBlur = () => {
        focused.value = false;
    };

    const updateAfterClearing = (value: any) => {
        tempClear.value = true;
        modelValue.value = value;
        tempClear.value = false;
    };

    const change = () => {
        if (inputEle.value == null) {
            return;
        }
        const inputTextValue: string = (inputEle.value.value || '').replace(/\s/g, '');
        if (inputTextValue == '') {
            // No value
            updateAfterClearing(undefined);
        } else {
            const coercedValue: T | undefined = opts.coerceNotEmpty(inputTextValue);
            if (coercedValue == null) {
                updateAfterClearing(undefined);
                return;
            }
            const clampedValue: T = opts.clamp ? opts.clamp(coercedValue) : coercedValue;
            if (opts.isValid && !opts.isValid(clampedValue)) {
                updateAfterClearing(undefined);
                return;
            }
            updateAfterClearing(clampedValue);
        }
    };

    const displayValue = computed((): string => {

        if (tempClear.value) {
            return '';
        }
        if (modelValue.value == null) {
            if (! focused.value && opts.formatNullForReading) {
                return opts.formatNullForReading();
            } else {
                return '';
            }
        }
        if (focused.value && opts.formatForEditing) {
            return opts.formatForEditing(modelValue.value);
        }
        if (opts.formatForReading) {
            return opts.formatForReading(modelValue.value);
        }
        return String(modelValue.value);
    });

    return { focused, onFocus, onBlur, change, updateAfterClearing, displayValue };
};

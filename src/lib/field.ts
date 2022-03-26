import type { Ref, PropType } from 'vue';
import type { MessageBag, Path, FormValue } from '@/main';
import { computed, provide, inject, ref } from 'vue';
import { sliceMessageBag, symbols } from '@/main';

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

type PropRefs<ValueType> = {
    modelValue?: Ref<unknown>,
    errors?: Ref<MessageBag | undefined>,
    name?: Ref<string | number | undefined>,
};

type FieldEmitType<ValueType> = {
    (e: 'update:modelValue', value: ValueType): void
    (e: 'update:errors', value: MessageBag): void
};

export function useFormField<ValueType extends FormValue> (valueCoerceFn: (val: unknown) => ValueType, emit: FieldEmitType<ValueType>, propRefs: PropRefs<ValueType>) {

    const name = computed((): (string | number | undefined) => {
        return propRefs?.name?.value;
    });

    const { path, pathString } = useExtendsPath(propRefs.name);

    const injectedModelValue = inject(symbols.modelValue, undefined);
    const setter = inject(symbols.setter, undefined);

    const modelValue = computed({
        get: (): ValueType => {
            if (name.value == null) {
                return valueCoerceFn(propRefs?.modelValue?.value);
            } else {
                return valueCoerceFn((injectedModelValue && injectedModelValue.value) ? (injectedModelValue.value as any)[name.value] : undefined);
            }
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

    return { path, pathString, modelValue, errors, myErrors, hasError, editMode };
};

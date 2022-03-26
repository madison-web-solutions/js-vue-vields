import type { Ref, InjectionKey } from 'vue';
import type { MessageBag } from '@/lib/MessageBag';
import type { ChoiceListProvider, SearchProvider } from './search';

let uniqueKeyCounter: number = 1;
export const getUniqueKey = function(): string {
    return 'k' + (uniqueKeyCounter++).toString(36);
};

export type ScalarFormValue = number | string | boolean | undefined | null;

export type KeyListFormValue = (number | string)[];

export type CompoundFormValue = {
    [key: string]: FormValue
};

export type RepeaterFormValue = CompoundFormValue[];

export type FormValue = ScalarFormValue | KeyListFormValue | RepeaterFormValue | CompoundFormValue;

export const coerceToScalarFormValue = (val: unknown): ScalarFormValue => {
    switch (typeof val) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'undefined':
            return val;
        case 'object':
            if (val == null) {
                return null;
            } else {
                return JSON.stringify(val);
            }
    }
    return String(val);
};

export const coerceToKeyListFormValue = (val: unknown): KeyListFormValue => {
    switch (typeof val) {
        case 'number':
        case 'string':
            return [val];
        case 'object':
            if (val == null) {
                return [];
            } else if (Array.isArray(val)) {
                const out: KeyListFormValue = [];
                for (const subVal of val) {
                    const key = coerceToScalarFormValue(subVal);
                    if (typeof key == 'string' || typeof key == 'number') {
                        if (! out.includes(key)) {
                            out.push(key);
                        }
                    }
                }
                return out;
            } else {
                const out: KeyListFormValue = [];
                for (const [subKey, subVal] of Object.entries(val)) {
                    if (subVal) {
                        out.push(subKey);
                    }
                }
                return out;
            }
    }
    // undefined, boolean
    return [];
};

export const coerceToRepeaterFormValue = (val: unknown): RepeaterFormValue => {
    if (Array.isArray(val)) {
        return val.map(coerceToCompoundFormValue);
    } else {
        return [];
    }
};

export const coerceToCompoundFormValue = (val: unknown): CompoundFormValue => {
    if (val == null) {
        return {};
    } else if (typeof val === 'object') {
        const coercedVals: CompoundFormValue = {};
        for (const [key, subVal] of Object.entries(val)) {
            coercedVals[key] = coerceToFormValue(subVal);
        }
        return coercedVals;
    } else {
        return {};
    }
};

export const coerceToFormValue = (val: unknown): FormValue => {
    switch (typeof val) {
        case 'number':
        case 'string':
        case 'boolean':
        case 'undefined':
            return val;
        case 'object':
            if (val == null) {
                return null;
            } else if (Array.isArray(val)) {
                if (val.length == 0) {
                    return [];
                } else if (typeof val[0] == 'string' || typeof val[0] == 'number') {
                    return coerceToKeyListFormValue(val);
                } else {
                    return val.map((subVal) => coerceToCompoundFormValue(subVal));
                }
            } else {
                const coercedVals: CompoundFormValue = {};
                for (const [key, subVal] of Object.entries(val)) {
                    coercedVals[key] = coerceToFormValue(subVal);
                }
                return coercedVals;
            }
    }
    return undefined;
};

export const copyCompoundFormValue = (val: CompoundFormValue): CompoundFormValue => {
    const mappedVals: CompoundFormValue = {};
    for (let key in val) {
        mappedVals[key] = copyFormValue(val[key]);
    }
    return mappedVals;
};

export const copyRepeaterFormValue = (val: RepeaterFormValue): RepeaterFormValue => {
    return val.map((subVal) => copyCompoundFormValue(subVal));
};

export const copyKeyListFormValue = (val: KeyListFormValue): KeyListFormValue => {
    return val.slice();
};

export const copyFormValue = (val: FormValue): FormValue => {
    if (val == null) {
        return val;
    } else if (Array.isArray(val)) {
        if (val.length == 0) {
            return [];
        } else if (typeof val[0] == 'string' || typeof val[0] == 'number') {
            return copyKeyListFormValue(val as KeyListFormValue);
        } else {
            return copyRepeaterFormValue(val as RepeaterFormValue);
        }
    } else if (typeof val == 'object') {
        return copyCompoundFormValue(val);
    } else {
        return val;
    }
};

export type Path = (string | number)[];

export const valueAtPath = (value: FormValue, path: Path): FormValue => {
    let curr: FormValue = value;
    if (path.length == 0) {
        return curr;
    }
    for (let nextPart of path) {
        if (curr == null) {
            return undefined;
        }
        if (Array.isArray(curr)) {
            const index = coerceToArrayKey(nextPart);
            curr = (index == null) ? undefined : curr[index];
        } else if (typeof curr == 'object' && curr.hasOwnProperty(nextPart)) {
            curr = curr[nextPart];
        } else {
            return undefined;
        }
    }
    return curr;
};

export const isArrayKey = (key: unknown): boolean => {
    switch (typeof key) {
        case 'number':
            return Number.isInteger(key) && key > -1;
        case 'string':
            const num = parseInt(key, 10);
            return (String(num) === key) && Number.isInteger(num) && num > -1;
    }
    return false;
};

export const coerceToArrayKey = (key: unknown): (number | undefined) => {
    switch (typeof key) {
        case 'number':
            return (Number.isInteger(key) && key > -1) ? key : undefined;
        case 'string':
            const num = parseInt(key, 10);
            return (String(num) === key && Number.isInteger(num) && num > -1) ? num : undefined;
    }
    return undefined;
};

/*
const setRepeaterValueAtIndex = (container: RepeaterFormValue, index: number, remainingPath: Path, value: FormValue): boolean => {
    if (remainingPath.length == 0) {
        // we're at the end of the path set the value and return
        if (typeof value == 'object' && value != null && !Array.isArray(value)) {
            container[index] = value;
            return true;
        } else {
            return false;
        }
    } else {
        // there is more to come
        const nextContainer: CompoundFormValue = container[index] || {};
        container[index] = nextContainer;
        return setValueAtPath(nextContainer, remainingPath, value);
    }
};

const setCompoundValueAtName = (container: CompoundFormValue, name: string, remainingPath: Path, value: FormValue): boolean => {
    if (remainingPath.length == 0) {
        // we're at the end of the path, set the value and return
        container[name] = value;
        return true;
    } else {
        // there is more to come
        const nextContainer = container[name];
        if (nextContainer == null) {
            // the next container doesn't exist yet, so we'll create it
            // peek at the next part to see whether to create a RepeaterFormValue or a CompoundFormValue
            const nextPart = remainingPath[0];
            remainingPath = remainingPath.slice(1);
            const nextArrayKey = coerceToArrayKey(nextPart);
            if (nextArrayKey == null) {
                const nextCompoundContainer: CompoundFormValue = {};
                container[nextPart] = nextCompoundContainer;
                return setCompoundValueAtName(nextCompoundContainer, String(nextPart), remainingPath, value);
            } else {
                const nextRepeaterContainer: RepeaterFormValue = [];
                container[name] = nextRepeaterContainer;
                return setRepeaterValueAtIndex(nextRepeaterContainer, nextArrayKey, remainingPath, value);
            }
        } else {
            if (Array.isArray(nextContainer) || (typeof nextContainer == 'object' && nextContainer != null)) {
                return setValueAtPath(nextContainer, remainingPath, value);
            } else {
                // the next container does exist, but it's a scalar value - we can't add to it
                return false;
            }
        }
    }
};

export const setValueAtPath = (container: CompoundFormValue | RepeaterFormValue, path: Path, value: FormValue): boolean => {
    if (path.length == 0) {
        throw "Empty path";
    }
    const nextPart = path[0];
    const remainingPath = path.slice(1);
    if (Array.isArray(container)) {
        const nextArrayKey = coerceToArrayKey(nextPart);
        if (nextArrayKey == null) {
            return false;
        } else {
            return setRepeaterValueAtIndex(container, nextArrayKey, remainingPath, value);
        }
    } else {
        return setCompoundValueAtName(container, String(nextPart), remainingPath, value);
    }
};
*/

export const coerceToBoolean = (value: unknown): boolean | undefined => {
    switch (typeof value) {
        case 'boolean':
            return value;
        case 'string':
            switch (value.toLowerCase()) {
                case 'true':
                case 'yes':
                case 'on':
                case 't':
                case 'y':
                case '1':
                    return true;
                case 'false':
                case 'no':
                case 'off':
                case 'f':
                case 'n':
                case '0':
                    return false;
            }
            return undefined;
        case 'number':
            if (value === 1) {
                return true;
            }
            if (value === 0) {
                return false;
            }
            return undefined;
    }
    return undefined;
};


// Utility function for re-indexing error messages
export const reindexErrors = (errors: MessageBag, indexMap: (index: number) => number | undefined): MessageBag => {
    const errorsCopy: MessageBag = {};
    for (let pathString in errors) {
        const path = pathString.split('.');
        const oldIndex = coerceToArrayKey(path[0]);
        if (oldIndex != null) {
            const newIndex = indexMap(oldIndex);
            if (newIndex == null) {
                continue;
            } else {
                path[0] = String(newIndex);
            }
        }
        errorsCopy[path.join('.')] = errors[pathString];
    }
    return errorsCopy;
};

export const startCase = (s: unknown): string => {
    return String(s)
        .trim()
        .replace(/_/g, ' ')
        .replace(/\b\w+/g, (s) => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase());
};

const symbols = {
    editMode: Symbol() as InjectionKey<Ref<"edit" | "view">>,
    path: Symbol() as InjectionKey<Ref<Path> | undefined>,
    modelValue: Symbol() as InjectionKey<Ref<FormValue> | undefined>,
    errors: Symbol() as InjectionKey<Ref<MessageBag> | undefined>,
    setter: Symbol() as InjectionKey<Ref<(value: FormValue, key: string | number) => void> | undefined>,
    errorsSetter: Symbol() as InjectionKey<Ref<(newSubErrors: MessageBag, key: string | number) => void> | undefined>,
    choiceListProvider: Symbol() as InjectionKey<Ref<ChoiceListProvider> | undefined>,
    searchProvider: Symbol() as InjectionKey<Ref<SearchProvider> | undefined>,
};
Object.freeze(symbols);
export { symbols };

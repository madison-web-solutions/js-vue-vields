import type {
    CompoundFormValue,
    FormValue,
    KeysList,
    MessageBag,
    Path,
    RepeaterFormValue,
    ScalarFormValue,
} from '@/main';

let uniqueKeyCounter: number = 1;
export const getUniqueKey = function(): string {
    return 'k' + (uniqueKeyCounter++).toString(36);
};

export const coerceToNumber = (value: unknown): number | undefined => {
    switch (typeof value) {
        case 'number':
            return value;
        case 'string':
            const num = parseFloat(value);
            return isNaN(num) ? undefined : num;
    }
    return undefined;
};

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

export const coerceToBooleansNativeMap = (value: any): Map<string | number, boolean> => {
    const out: Map<string | number, boolean> = new Map();
    switch (typeof value) {
        case 'string':
        case 'number':
            out.set(value, true);
            break;
        case 'object':
            if (value == null) {
                // nothing
            } else if (Array.isArray(value)) {
                value.forEach((subVal) => {
                    if (typeof subVal == 'string' || typeof subVal == 'number') {
                        out.set(subVal, true);
                    }
                });
            } else {
                for (const [key, subVal] of Object.entries(value)) {
                    out.set(key, !!subVal);
                }
            }
            break;
    }
    return out;
};

export const coerceToKeysList = (value: any): KeysList => {
    const partial = coerceToBooleansNativeMap(value);
    const out: KeysList = [];
    for (const [key, subVal] of partial.entries()) {
        if (subVal) {
            out.push(key);
        }
    }
    return out;
};

export const coerceToRepeaterFormValue = (val: unknown): RepeaterFormValue => {
    if (Array.isArray(val)) {
        return val.map(coerceToFormValue);
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
                return val.map(coerceToFormValue);
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
    return val.map((subVal) => copyFormValue(subVal));
};

export const copyFormValue = (val: FormValue): FormValue => {
    if (val == null) {
        return val;
    } else if (Array.isArray(val)) {
        return copyRepeaterFormValue(val as RepeaterFormValue);
    } else if (typeof val == 'object') {
        return copyCompoundFormValue(val);
    } else {
        return val;
    }
};

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

import type { MessageBag } from 'vue-fields-ms';

export type FakeErrorOptions = {
  // Array-valued single fields (Tokens/Checkboxes/multi-select): one error at the field
  // path, no per-element recursion.
  multiValueKeys?: string[];
  // Object-valued single fields (e.g. LinkField): one error at the field path, no recursion.
  leafObjectKeys?: string[];
};

const REQUIRED = 'This field is required.';

const POOL = [
  'This value is not valid.',
  'Please check this field and try again.',
  'The format of this entry is incorrect.',
  'This value is too long.',
];

const isEmptyValue = (value: unknown): boolean => {
  return value == null || value === '' || (Array.isArray(value) && value.length === 0);
};

const isPlainObject = (value: unknown): boolean => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Walk a form-values object and produce a MessageBag with plausible validation errors at
 * every level of the tree — scalar fields, multi-value fields, and repeaters (field-level,
 * row-level and sub-field messages). Useful for demoing how errors render.
 */
export const makeFakeErrors = (value: unknown, options: FakeErrorOptions = {}): MessageBag => {
  const multiValueKeys = options.multiValueKeys ?? [];
  const leafObjectKeys = options.leafObjectKeys ?? [];
  const bag: MessageBag = {};
  let counter = 0;

  // Build the message list for one field. Varies deterministically: empty values get a
  // "required" message, otherwise we cycle the pool, and every 3rd field gets a second
  // message so multi-message rendering is exercised.
  const messagesFor = (val: unknown): string[] => {
    const messages = [isEmptyValue(val) ? REQUIRED : POOL[counter % POOL.length]];
    if (counter % 3 === 2) {
      messages.push(POOL[(counter + 1) % POOL.length]);
    }
    counter++;
    return messages;
  };

  const walk = (val: unknown, path: string): void => {
    const name = path.slice(path.lastIndexOf('.') + 1);

    // Object-valued single field (e.g. LinkField): one error at the field path, no recursion.
    if (leafObjectKeys.includes(name)) {
      bag[path] = messagesFor(val);
      return;
    }

    // Multi-value field (Tokens/Checkboxes): the value can have a problem as a whole AND a
    // problem with a particular item. Emit a whole-field message at the field path plus a
    // per-item message, so both render together. The item key depends on the value shape:
    // arrays (KeyListFormValue) are keyed by index, the booleans map (BooleansMapFormValue)
    // by choice key (and only the selected/true entries get one, mirroring the array case).
    if (multiValueKeys.includes(name)) {
      bag[path] = messagesFor(val);
      if (Array.isArray(val)) {
        val.forEach((element, index) => {
          bag[`${path}.${index}`] = messagesFor(element);
        });
      } else if (isPlainObject(val)) {
        const map = val as Record<string, unknown>;
        for (const key in map) {
          if (map[key]) {
            bag[`${path}.${key}`] = messagesFor(map[key]);
          }
        }
      }
      return;
    }

    if (Array.isArray(val)) {
      // A repeater: field-level message above the rows, then per-row messages.
      if (path) {
        bag[path] = messagesFor(val);
      }
      val.forEach((element, index) => {
        const childPath = `${path}.${index}`;
        if (isPlainObject(element)) {
          // Compound row: row-level message + sub-field messages.
          bag[childPath] = messagesFor(element);
          walk(element, childPath);
        } else {
          // Simple repeater row.
          bag[childPath] = messagesFor(element);
        }
      });
      return;
    }

    if (isPlainObject(val)) {
      // A FieldGroup: recurse into each key. No message at the object's own path (avoids a
      // stray root error).
      for (const key in val as Record<string, unknown>) {
        walk((val as Record<string, unknown>)[key], path ? `${path}.${key}` : key);
      }
      return;
    }

    // Scalar / null.
    bag[path] = messagesFor(val);
  };

  walk(value, '');
  return bag;
};

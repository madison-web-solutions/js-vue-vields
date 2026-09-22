import type { Component } from "vue";

// Generic, cross-cutting helpers with no single-domain home: a numeric clamp, a
// string Start-Case formatter, and the Vue prop-forwarding helper pickPropsFor.

/**
 * Constrain `val` to the inclusive range [min, max].
 * A null/undefined bound means "no limit" on that side.
 */
export const clamp = (min: number | null | undefined, max: number | null | undefined, val: number): number => {
  if (min != null) {
    val = Math.max(min, val);
  }
  if (max != null) {
    val = Math.min(max, val);
  }
  return val;
};

/**
 * Convert a value to Start Case: underscores become spaces and each word is capitalised
 * (with the remainder of the word lower-cased). Does not split camelCase or collapse runs
 * of whitespace. Typically used to derive a human label from a field name.
 */
export const startCase = (s: unknown): string => {
  return String(s)
    .trim()
    .replace(/_/g, " ")
    .replace(
      /\b\w+/g,
      (s) => s.charAt(0).toUpperCase() + s.substr(1).toLowerCase()
    );
};

// At runtime, a Vue component's `.props` field is either:
//   - undefined / null (no props),
//   - a string array (array-syntax declaration), or
//   - a record keyed by prop name (object-syntax declaration; this is what
//     <script setup> + defineProps<T>() compiles to).
type RuntimePropsField = readonly string[] | Record<string, unknown> | null | undefined;

const propKeysOf = (target: { props?: RuntimePropsField }): string[] => {
  const declared = target.props;
  if (!declared) return [];
  if (Array.isArray(declared)) return [...declared];
  return Object.keys(declared);
};

// Returns just the props from `source` that the `target` component declares.
// Useful inside a wrapper field component for forwarding the wrapped
// component's props without listing them by hand — pickPropsFor reads what
// the target accepts at runtime, so the list automatically stays in sync as
// the wrapped component evolves.
//
// `modelValue` and `errors` are excluded by default because wrappers should
// handle two-way bindings with defineModel + v-model on the target. Pass
// additional names via `excludeKeys` if the target has other v-model props
// (e.g. `v-model:open`).
//
// Usage in a wrapper component:
//
//   const props = defineProps<
//     Omit<RepeaterFieldProps & FieldProps, 'modelValue' | 'errors'> & MyExtras
//   >();
//   const modelValue = defineModel<RepeaterFormValue>();
//   const errors = defineModel<MessageBag>('errors');
//
//   <RepeaterField v-bind="pickPropsFor(RepeaterField, props)"
//                  v-model="modelValue"
//                  v-model:errors="errors">
//     ...
//   </RepeaterField>
//
export const pickPropsFor = (
  target: Component | { props?: RuntimePropsField },
  source: object,
  excludeKeys: readonly string[] = ["modelValue", "errors"],
): Record<string, unknown> => {
  const keys = propKeysOf(target as { props?: RuntimePropsField });
  const src = source as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (excludeKeys.includes(key)) continue;
    if (key in src) out[key] = src[key];
  }
  return out;
};

/**
 * Parse a number from text that may carry the group and decimal separators used when the
 * number was displayed - so a field which shows "10,000" accepts "10,000" back rather than
 * truncating it at the comma. The separators are read from `formatter` (defaulting to the
 * runtime locale's decimal format) rather than hard-coded, because "10,000.5" and
 * "10.000,5" are the same number in different locales.
 * Returns NaN if the text does not contain a number, as parseFloat does.
 */
export const parseLocaleFloat = (text: string, formatter?: Intl.NumberFormat): number => {
  const parts = (formatter ?? new Intl.NumberFormat()).formatToParts(12345.6);
  const group = parts.find((part) => part.type === "group")?.value;
  const decimal = parts.find((part) => part.type === "decimal")?.value;
  if (group != null && group !== "") {
    text = text.split(group).join("");
  }
  if (decimal != null && decimal !== "" && decimal !== ".") {
    text = text.split(decimal).join(".");
  }
  return parseFloat(text);
};

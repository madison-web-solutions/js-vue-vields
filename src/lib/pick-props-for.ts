import type { Component } from "vue";

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

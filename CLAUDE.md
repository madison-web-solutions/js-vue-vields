# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start Vite dev server with demo app
npm run build      # Build library (Vite + vue-tsc for type declarations)
npm run type-check # Type-check only, no emit
npm test           # Run the unit test suite once (vitest run)
npm run test:watch # Run the unit tests in watch mode
npm run demo:reset # Delete demo/data/ so the demo reseeds on next dev start
```

There is no lint command. See **Testing** below for the test suite — run `npm test` and `npm run type-check` after making changes.

## What This Is

**vue-fields-ms** is a Vue 3 form field component library published as an ES-only npm package. It ships `dist/index.js` + `dist/index.d.ts`. The `demo/` app exists for development and testing, and as a way to see how the library is used — run `npm run dev` and open the browser to try components interactively.

## Testing

Comprehensive unit suite (Vitest + jsdom + `@vue/test-utils`) in `tests/` covering every field, the composables, the `lib/` utilities, and the binding paths. Run `npm test` and `npm run type-check` after changes. Providers are mocked inline and injected via `injectionSymbols`. Shared behaviours run through `describe.each` fixtures (`scalar-`/`choice-field-`/`compound-`/`repeater-behaviors`) — for a new field variant add a fixture rather than duplicating tests. Otherwise, follow the patterns in the nearest existing test file.

## Architecture

### Entry point & exports

`src/index.ts` re-exports everything consumers use. `src/vuePlugin.ts` defines the Vue plugin installed via `app.use(vueFieldsMsPlugin, options)`.

### Field binding (per-level)

`useFormField()` (`src/lib/useFormField.ts`) is the core composable every field uses; it returns the field's two-way `value`/`errors` refs plus `field` state. Binding is **per level** (`src/lib/context.ts`): a container provides its value and errors to descendants with `provideFormValues` (injected as `parentValue`/`parentErrors`), and a child addresses its parent's value by a single key — its `name` (a string ⟹ an object) or `index` (a number ⟹ an array), or keyless ⟹ the whole parent value. There is no multi-segment value addressing; the only real paths are the display path (`useExtendsPath` → input `name`) and `getCurrentValue`'s relative dotted query.

**v-model precedence.** An explicit `v-model` makes a field own its value — the root of a fresh context — and ignore any `name`/`index`; `v-model:errors` does the same for errors. "Explicit" means `modelValue !== undefined`, so `v-model="ref(undefined)"` opts out and inherits from the parent; use `null`/`""` for an owned-but-empty field. Preserve this `undefined`-sentinel invariant when editing `useFormField`.

### Composable hierarchy

- `useFormField` — base for all fields (value, errors, disabled, edit-mode state)
- `useHasChoices` / `useHasChoicesSingle` — adds options/choices lookup
- `useFormFieldWithChoicesMultiple` — multi-select logic on top of choices
- `useRepeaterField` — manages array items (add/remove/reorder)
- `useExtendsPath`, `useExtendsEditMode`, `useExtendsConfig` — context propagation for container fields

### Provider system

The plugin injects four provider interfaces into the Vue app (via `inject`/`provide` with symbols from `src/lib/injection-symbols.ts`):

| Provider | Purpose |
|---|---|
| `choicesProvider` | Supplies options for Select/Radio/Checkbox fields |
| `linksProvider` | Supplies link suggestions for LinkField |
| `mediaProvider` | Media library: search, upload, update, delete |
| `passwordStrengthProvider` | Password strength scoring |

The `fieldWrapperComponent` injection allows apps to swap in a custom wrapper around every field.

### Field categories

- **Simple scalars**: Text, TextArea, Number, Currency, Password, Toggle, Checkbox, Date, DateTime, Time, Timestamp
- **Choice-based**: Select, Radio, CustomSelect, CustomRadio, Checkboxes — all driven by `choicesProvider`
- **Tokens**: TokensField — comma/tag-style multi-value input
- **Rich text**: HtmlField — wraps CKEditor 5, async-loaded so it doesn't bloat the main bundle
- **Media**: MediaField + MediaLibrary/MediaDetails/MediaPreview — driven by `mediaProvider`
- **Compound/container**: FieldGroup (object), RepeaterField/RepeaterTableField (array), FlexibleContentField (typed blocks), FieldArray/FieldArrayItem
- **Search**: SearchField + SearchInterface

### Styling

All components use Bootstrap 5 utility classes. SCSS lives in `scss/` (published) and `demo/scss/` (demo only). Import `vue-fields-ms/scss/main` in consuming apps. Variables are exposed via `vue-fields-ms/scss/variables`.

### TypeScript conventions

- All SFCs use `<script setup lang="ts">`
- `src/types.ts` is the canonical type file — `FormValue`, `Path`, `FieldProps`, provider interfaces, `MessageBag`
- Path alias `vue-fields-ms` resolves to `./src/main.ts` inside this repo (for the demo app)
- Strict mode is on
- **Prefer `const f = () => {}` over `function f() {}`** for all function definitions — this applies everywhere including module-level helpers, exported functions, and `<script setup>` handlers. The `function` declaration syntax is not used in this codebase.
- **Always use semicolons** at the end of statements, even where they are optional.

### Build output

Vite builds a single ES module (`dist/index.js`). Not bundled (externalized in `vite.config.ts`): `vue` (a peer dependency), `date-format-ms`, and `ckeditor5` (both regular dependencies). CSS code-splitting is enabled. The async `HtmlField` chunk imports `ckeditor5/ckeditor5.css` as an external reference, so CKEditor's styles load automatically from the consumer's own `ckeditor5` install when `HtmlField` is used — no separate CSS import is required.

# vue-fields-ms

A Vue 3 form-field component library (Bootstrap 5 styling). ES-only npm package — ships `dist/index.js` + `dist/index.d.ts`.

Field categories: simple scalars (Text, Number, Currency, Date/Time, Toggle…), choice-based (Select, Radio, Checkboxes…), tokens, rich text (HtmlField / CKEditor), media, and compound/container fields (FieldGroup, RepeaterField, FlexibleContentField…).

## Using it in a project

```bash
npm install vue-fields-ms
```

Requires Vue `^3.5` (peer dependency). `ckeditor5` and `date-format-ms` come as regular dependencies — `ckeditor5` is only pulled in at runtime if you actually use `HtmlField`.

**1. Register the plugin** (providers are all optional — supply the ones you need):

```ts
import { vueFieldsMsPlugin, type VueFieldsMsPluginOptions } from 'vue-fields-ms';
import { choicesProvider, mediaProvider /* … */ } from './providers';

const opts: VueFieldsMsPluginOptions = {
  choicesProvider,            // options for Select/Radio/Checkbox fields
  linksProvider,              // link suggestions for LinkField
  mediaProvider,              // media library: search/upload/update/delete
  uploadProvider,             // file uploads for FileUploadField
  passwordStrengthProvider,   // password strength scoring
  // fieldWrapperComponent,   // optional: swap the wrapper rendered around every field
  config: {                   // optional defaults
    'textArea.numRows': 4,
    'currency.currencyCode': 'GBP',
  },
};

app.use(vueFieldsMsPlugin, opts);
```

**2. Import the styles** (Bootstrap-based SCSS):

```scss
@use 'vue-fields-ms/scss/main';
// variables are exposed separately: vue-fields-ms/scss/variables
```

CKEditor's own CSS loads automatically with the `HtmlField` chunk — nothing extra to import.

**3. Use the fields.** Binding is **per level**: a container owns the value via `v-model`, and each child addresses one key of its parent by `name` (object key) or `index` (array index).

```vue
<FieldGroup v-model="vals">
  <TextField name="first_name" label="First name" required />
  <SelectField name="country" label="Country" />
  <RepeaterField name="branches" label="Branches" appendLabel="Add branch">
    <TextField name="branch_name" label="Branch name" />
  </RepeaterField>
</FieldGroup>
```

A standalone field can own its own value with `v-model` directly. See `demo/examples/` for fuller patterns, and `CLAUDE.md` for the binding/architecture details.

## Local development

```bash
npm run dev        # Vite dev server with the demo app — open the browser to try components
npm run demo:reset # delete demo/data/ so the demo reseeds on next dev start

npm test           # run the unit suite once (Vitest + jsdom + @vue/test-utils)
npm run test:watch # unit tests in watch mode
npm run type-check # vue-tsc, no emit

npm run build      # build the library (Vite + type declarations) into dist/
```

The `demo/` app is the development harness and a live reference for how the library is used. Inside the repo, the `vue-fields-ms` import alias resolves to `src/index.ts` (see `vite.config.ts`), so the demo imports exactly as a consuming app would.

After making changes, run `npm test` and `npm run type-check`.

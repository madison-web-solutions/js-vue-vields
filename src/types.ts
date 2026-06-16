import type { Ref } from "vue";
import { iconMap } from "./lib/icons";
import FieldWrapper from "./components/FieldWrapper.vue";

export type Dict<T> = { [key: string]: T };

export type Loose<T> = {
  [K in keyof T]?: T[K] | null | undefined;
};

export type RefsOf<T> = {
  [K in keyof T]?: Ref<T[K]>;
};

export type MessageBag = { [path: string]: string[] };

export type Choosable = {
  key: number | string;
  label: string;
};

export type PendingChoosable = {
  pending: true;
  key: number | string;
};

export type ScalarFormValue = number | string | boolean | undefined | null;

// Type used for things like CheckBoxesField where the value is a list of the selected keys
export type KeyListFormValue = (number | string)[];
// Type used for things like CheckBoxesField where the value is an object with boolean values for each key
export type BooleansMapFormValue = { [key: string]: boolean };

export type CompoundFormValue = {
  [key: string]: FormValue;
};

export type RepeaterFormValue = FormValue[];

export type FormValue =
  | ScalarFormValue
  | KeyListFormValue
  | BooleansMapFormValue
  | RepeaterFormValue
  | CompoundFormValue;

export type Path = (string | number)[];

export type EditMode = 'edit' | 'view';


export type LookupFound<T> = {
  status: "found";
  resource: T;
};
export type LookupNotFound = {
  status: "not-found";
};
export type LookupResult<T> = LookupFound<T> | LookupNotFound;


export type UpdateOk<T> = {
  status: "ok";
  resource: T;
};
export type UpdateFailed = {
  status: "fail";
  errors: MessageBag;
};
export type UpdateResult<T> = UpdateOk<T> | UpdateFailed;


export type SearchResultPage<T> = {
  page: number;
  hasMore: boolean;
  suggestions: T[];
};

export type LinkAlias = {
  scheme: string;
  key: string | number;
  label: string;
  url: string;
};

export type MediaItem = {
  id: string | number;
  status: "uploading" | "available" | "missing";
  title: string;
  extension: string;
  src: string | null;
  alt: string | null;
  cropCenter?: { top: number; left: number };
  src_thumb?: string | null;
};

export type MediaItemWithThumbnail = MediaItem & {
  src_thumb: string;
};

export type ChoicesProvider = {
  getAll: (
    directory: string,
    extraParams?: object,
  ) => Promise<LookupResult<Choosable[]>>;
  search: (
    directory: string,
    searchText: string,
    page?: number,
    extraParams?: object,
  ) => Promise<SearchResultPage<Choosable>>;
  lookup: (
    directory: string,
    key: number | string,
    extraParams?: object,
  ) => Promise<LookupResult<Choosable>>;
};

export type LinksProvider = {
  search: (
    scheme: string,
    searchText: string,
    page?: number,
    extraParams?: object,
  ) => Promise<SearchResultPage<LinkAlias>>;
  lookup: (scheme: string, key: string) => Promise<LookupResult<LinkAlias>>;
  schemes: { key: string; label: string }[];
};

export type MediaProvider = {
  search: (
    searchText?: string,
    page?: number,
    extraParams?: object,
  ) => Promise<SearchResultPage<MediaItem>>;
  lookup: (key: number | string) => Promise<LookupResult<MediaItem>>;
  upload: (
    data: FormData,
    progressCallback: (loaded: number, total: number) => void,
  ) => Promise<UpdateResult<MediaItem>>;
  replace?: (
    key: number | string,
    data: FormData,
    progressCallback: (loaded: number, total: number) => void,
  ) => Promise<UpdateResult<MediaItem>>;
  delete: (key: number | string) => Promise<boolean>;
  update: (
    key: number | string,
    data: object,
  ) => Promise<UpdateResult<MediaItem>>;
};

export type PasswordStrengthProvider = {
  check: (password: string) => Promise<number>;
  maxStrength: number;
};

// Metadata describing a file held by a FileUploadField. The field's bound value is only the
// `token` string (a ScalarFormValue); this richer info lives in the app-scoped file cache (see
// uploadedFileCache) and is returned by the upload provider. The bytes are never part of the value.
export type UploadedFileInfo = {
  token: string;    // 'vfmfile_<sha256>' for inline mode, or the server's reference for upload mode
  name: string;     // original filename
  type: string;     // mime type
  size: number;     // bytes
  url?: string;     // optional server-supplied preview/download URL (upload mode)
};

// Provider used by FileUploadField in `upload` mode: the file is sent to the server on selection
// and the server returns a token (plus optional url) identifying the stored file. Mirrors the shape
// of MediaProvider.upload so existing backends are easy to adapt.
export type UploadProvider = {
  upload: (
    data: FormData,
    progressCallback: (loaded: number, total: number) => void,
  ) => Promise<UpdateResult<UploadedFileInfo>>;
};

// An entry in the uploaded-file cache: the file's metadata, plus the real File for `inline` mode
// (absent for `upload` mode, where the file is already on the server).
export type UploadedFileCacheEntry = {
  info: UploadedFileInfo;
  file?: File;
};

// Client-side registry mapping a token to its file/metadata. Provided per-app by the plugin; backs
// FileUploadField's inline mode and is read by the useUploadedFiles submission helpers.
export type UploadedFileCache = {
  put: (info: UploadedFileInfo, file?: File) => void;
  get: (token: string) => UploadedFileCacheEntry | undefined;
  has: (token: string) => boolean;
  release: (token: string) => void;
  clear: () => void;
};


export type IconName = keyof typeof iconMap;

// Type that props are expected to have (or extend) on a form field component
export type FieldProps = {
  modelValue?: unknown;
  errors?: MessageBag;
  name?: string | undefined;
  index?: number | undefined;
  label?: string | undefined;
  required?: boolean | undefined;
  help?: string | undefined;
  placeholder?: string | undefined;
  disabled?: boolean | undefined;
  autocomplete?: string | undefined;
};

export type RepeaterFieldProps = {
  min?: number | undefined;
  max?: number | undefined;
  movable?: boolean | undefined;
};

export type UsesSearchesFieldProps = {
  directory: string,
  extraParams?: object | undefined
};

export type HasChoicesFieldProps = {
  directory?: string | undefined,
  choices?: string | Dict<string> | Choosable[] | undefined,
  extraParams?: object | undefined
};

export type HasChoicesMultipleFieldProps = HasChoicesFieldProps & {
  valueIs?: 'array' | 'object'
};

export type HasMaxCharsFieldProps = {
  max?: number | undefined
};


// Type that emits are expected to have (or extend) on a form field component
// Passed as an argument to useFormField composable
export type FieldEmitType<ValueType> = {
  (e: "update:modelValue", value: ValueType): void;
  (e: "update:errors", value: MessageBag): void;
};

// Optional extra emit for fields that fire an event when the user presses Enter
// while focused on the input (e.g. to trigger a form submit). Combine with
// FieldEmitType only on fields that actually emit it, so the emit signature
// reflects what a field really does:
//   defineEmits<FieldEmitType<T> & EnterPressEmitType>()
export type EnterPressEmitType = {
  (e: "enterPress"): void;
};

export type FieldState<ValueType extends FormValue> = {
  path: Path,
  pathString: string,
  rawValue: unknown,
  modelValue: ValueType,
  errors: MessageBag,
  myErrors: string[],
  hasError: boolean,
  editMode: EditMode,
  inputEleId: string,

  label: string|undefined,
  required: boolean,
  disabled: boolean,
  help: string|undefined,
  placeholder: string|undefined,
  autocomplete: string|undefined,
};

export type RepeaterItem = {
  index: number;
  isFirst: boolean;
  isLast: boolean;
  rowVals: FormValue;
  rowErrors: string[];
  showRowErrors: boolean;
  childErrors: MessageBag;
  insertRowBefore: () => void;
  insertRowAfter: () => void;
  deleteRow: () => void;
  startMove: () => void;
  completeMoveBefore: () => void;
  completeMoveAfter: () => void;
};

export type RepeaterTableColOpts = {
  name: string;
  label?: string | null | undefined;
};

export type RepeaterTableCol = {
  name: string;
  label: string;
};

export type ParsesTextFieldOptions<T> = {
  coerceNotEmpty: (val: string) => T | undefined;
  isValid?: (val: T) => boolean;
  clamp?: (val: T) => T;
  formatForReading?: (val: T) => string;
  formatNullForReading?: () => string;
  formatForEditing?: (val: T) => string;
};

export type Config = {
  noValueLabel: string;
  "textArea.numRows": number;
  "date.displayFormat": string;
  "dateTime.displayFormat": string;
  "timestamp.displayFormat": string;
  "currency.currencyCode": string | null;
  "currency.showCurrency": boolean;
  'html.subSuperScript': boolean;
  'html.code': boolean;
  'html.tables': boolean;
  "media.supportCropCenter": boolean,
  "text.autofillReconcile": boolean;
};

export type ConfigKey = keyof Config;

export type VueFieldsMsPluginOptions = {
  choicesProvider?: ChoicesProvider | undefined,
  linksProvider?: LinksProvider | undefined,
  mediaProvider?: MediaProvider | undefined,
  uploadProvider?: UploadProvider | undefined,
  passwordStrengthProvider?: PasswordStrengthProvider | undefined,
  fieldWrapperComponent?: typeof FieldWrapper | undefined,
  config?: Partial<Config>
};

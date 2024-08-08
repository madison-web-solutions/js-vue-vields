import type { Ref } from 'vue';
import { FieldWrapper } from '../main';

export type EditMode = "edit" | "view";

export type Path = (string | number)[];

export type KeysList = (string | number)[];

export type MessageBag = { [path: string]: string[] };

export type ScalarFormValue = number | string | boolean | undefined | null;

export type CompoundFormValue = { [key: string]: FormValue };

export type RepeaterFormValue = FormValue[];

export type FormValue = ScalarFormValue | RepeaterFormValue | CompoundFormValue;

export type BooleansMap = {[key: string]: boolean};

export type FixedLens<T> = {
    get: () => T,
    set: (newVal: T) => void,
    lensType: 'fixed',
};

export type IndexedLens<T> = {
    get: (index: number) => T,
    set: (index: number, newVal: T) => void,
    lensType: 'indexed',
};

export type NamedLens<T> = {
    get: (name: string) => T,
    set: (name: string, newVal: T) => void,
    lensType: 'named',
};

export type Lens<T> = (FixedLens<T> | IndexedLens<T> | NamedLens<T>);

export type Choosable = {
    key: number | string,
    label: string,
};

export type PendingChoosable = {
    pending: true,
    key: number | string,
};

export type UpdateOk<T> = {
    status: 'ok',
    resource: T
};
export type UpdateFailed = {
    status: 'fail',
    errors: MessageBag,
}
export type UpdateResult<T> = UpdateOk<T> | UpdateFailed;

export type LookupFound<T> = {
    status: 'found',
    resource: T,
};
export type LookupNotFound = {
    status: 'not-found',
};
export type LookupResult<T> = LookupFound<T> | LookupNotFound;

export type LinkAlias = {
    scheme: string,
    key: string | number,
    label: string,
    url: string,
};

export type SearchResultPage<T> = {
    page: number,
    hasMore: boolean,
    suggestions: T[],
};

export type MediaItem = {
    id: string | number,
    status: 'uploading' | 'available' | 'missing',
    title: string,
    extension: string,
    src: string | null,
    alt: string | null,
    cropCenter?: {top: number, left: number},
    // media type ?
};

export type ResizableMediaItem = MediaItem & {
    src_thumb: string,
};

export type RepeaterTableColOpts = {
    name: string,
    label?: string | null | undefined,
};

export type RepeaterTableCol = {
    name: string,
    label: string,
};

export type ChoicesProvider = {
    getAll: (directory: string, extraParams?: object) => Promise<LookupResult<Choosable[]>>,
    search: (directory: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<Choosable>>,
    lookup: (directory: string, key: number | string, extraParams?: object) => Promise<LookupResult<Choosable>>,
};

export type LinksProvider = {
    search: (scheme: string, searchText: string, page?: number, extraParams?: object) => Promise<SearchResultPage<LinkAlias>>,
    lookup: (scheme: string, key: string) => Promise<LookupResult<LinkAlias>>,
    schemes: {key: string, label: string}[],
};

export type MediaProvider = {
    search: (searchText?: string, page?: number, extraParams?: object) => Promise<SearchResultPage<MediaItem>>,
    lookup: (key: number | string) => Promise<LookupResult<MediaItem>>,
    upload: (data: FormData, progressCallback: (loaded: number, total: number) => void) => Promise<UpdateResult<MediaItem>>,
    delete: (key: number | string) => Promise<boolean>,
    update: (key: number | string, data: object) => Promise<UpdateResult<MediaItem>>,
};

export type PasswordStrengthProvider = {
    check: (password: string) => Promise<number>,
    maxStrength: number,
};

export type UseFormFieldPropRefs = {
    modelValue?: Ref<unknown>,
    errors?: Ref<MessageBag | undefined>,
    name?: Ref<string | undefined>,
    index?: Ref<number | undefined>,
    label?: Ref<string | undefined>,
    required?: Ref<boolean | undefined>,
    help?: Ref<string | undefined>,
    placeholder?: Ref<string | undefined>,
    tooltip?: Ref<string | undefined>,
    disabled?: Ref<boolean | undefined>,
    fieldTypeSlug?: Ref<string | undefined>,
    editMode?: Ref<EditMode | undefined>,
    default?: Ref<unknown>,
};

export type UseFormFieldOpts = {
    fieldTypeSlug?: string,
};

export type FieldEmitType<ValueType> = {
    (e: 'update:modelValue', value: ValueType): void
    (e: 'update:errors', value: MessageBag): void
};

export type UseHasChoicesPropRefs = {
    directory?: Ref<string | undefined>,
    choices?: Ref<string | object | undefined>,
    extraParams?: Ref<object | undefined>,
};

export type UseFormFieldHasChoicesMultiplePropRefs =
    UseFormFieldPropRefs
    &  UseHasChoicesPropRefs
    & {
        valueIs?: Ref<"array" | "object">,
    };

export type ParsesTextFieldOptions<T> = {
    coerceNotEmpty: (val: string) => T | undefined,
    isValid?: (val: T) => boolean,
    clamp?: (val: T) => T,
    formatForReading?: (val: T) => string,
    formatNullForReading?: () => string,
    formatForEditing?: (val: T) => string,
};

export type UseRepeaterFieldPropRefs = UseFormFieldPropRefs & {
    min?: Ref<number | undefined>,
    max?: Ref<number | undefined>,
    movable?: Ref<boolean | undefined>,
};

export type RepeaterItem = {
    index: number,
    rowVals: FormValue,
    rowErrors: string[],
    showRowErrors: boolean,
    childErrors: MessageBag,
    insertRowBefore: () => void,
    insertRowAfter: () => void,
    deleteRow: () => void,
    startMove: () => void,
    completeMoveBefore: () => void,
    completeMoveAfter: () => void,
};

export type UseHasMaxCharsPropRefs = {
    max?: Ref<number | undefined>,
};

export type Config = {
    'textArea.numRows': number,
    'currency.currencyCode': string | null,
    'currency.showCurrency': boolean,
    'media.supportCropCenter': boolean,
};

export type ConfigKey = keyof Config;

export type AppConfigOptions = Config & {
    registerFieldComponents: boolean,
    componentPrefix: string,
    cssPrefix: string,
    fieldWrapperComponent: typeof FieldWrapper,
    choicesProvider: ChoicesProvider,
    linksProvider: LinksProvider,
    mediaProvider: MediaProvider,
    passwordStrengthProvider: PasswordStrengthProvider,
};


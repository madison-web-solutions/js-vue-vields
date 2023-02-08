import { defineAsyncComponent } from 'vue';
import type { App, Component } from 'vue';

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

import type { CompoundFormValue, RepeaterFormValue, FormValue, Path } from '@/lib/util';
import type { MessageBag } from '@/lib/MessageBag';
import type { Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider } from '@/lib/search';
import type { MediaItem, ResizableMediaItem } from '@/lib/media';
import type { BooleansMap, KeysList, ParsesTextFieldOptions } from '@/lib/field';
import { sliceMessageBag, spliceMessageBag, messageBagToString } from '@/lib/MessageBag';
import { startCase, getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols } from '@/lib/util';
import { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField } from '@/lib/field';
import { useHasMaxChars } from '@/lib/text';
import { useSearches } from '@/lib/search';
import { useRepeaterField } from '@/lib/repeater';
import TextField from "@/components/TextField.vue";
import TextAreaField from "@/components/TextAreaField.vue";
import CheckboxField from "@/components/CheckboxField.vue";
import CheckboxesField from "@/components/CheckboxesField.vue";
import CurrencyField from '@/components/CurrencyField.vue';
import DateField from '@/components/DateField.vue';
import NumberField from "@/components/NumberField.vue";
import ToggleField from "@/components/ToggleField.vue";
import RepeaterField from "@/components/RepeaterField.vue";
import RepeaterRow from "@/components/RepeaterRow.vue";
import RadioField from '@/components/RadioField.vue';
import SearchField from '@/components/SearchField.vue';
import SelectField from '@/components/SelectField.vue';
import CustomSelectField from '@/components/CustomSelectField.vue';
import FlexibleContentField from '@/components/FlexibleContentField.vue';
import LinkField from "@/components/LinkField.vue";
import FieldWrapper from '@/components/FieldWrapper.vue';
import FieldGroup from '@/components/FieldGroup.vue';
import MediaPreview from '@/components/media/MediaPreview.vue';
import MediaLibrary from '@/components/media/MediaLibrary.vue';
import MediaDetails from '@/components/media/MediaDetails.vue';
import MediaField from '@/components/media/MediaField.vue';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter.vue';
import PasswordField from '@/components/PasswordField.vue';
import TimeField from '@/components/TimeField.vue';
import CompoundField from '@/components/CompoundField.vue';
import RepeaterTableField from "@/components/RepeaterTableField.vue";
import RepeaterTableRow from "@/components/RepeaterTableRow.vue";

const HtmlField = defineAsyncComponent(() => import('@/components/HtmlField.vue'));

const publicComponents: Record<string, Component> = {
    TextField,
    TextAreaField,
    CheckboxField,
    CheckboxesField,
    CurrencyField,
    DateField,
    NumberField,
    ToggleField,
    RepeaterField,
    RadioField,
    SearchField,
    SelectField,
    CustomSelectField,
    HtmlField,
    FlexibleContentField,
    LinkField,
    FieldGroup
};

const registerComponents = (app: App, prefix?: string | null | undefined) => {
    const _prefix: string = (prefix == null ? '' : prefix);
    for (const name in publicComponents) {
        app.component(_prefix + name, publicComponents[name]);
    }
};

export type { CompoundFormValue, RepeaterFormValue, FormValue, MessageBag, BooleansMap, KeysList, MediaItem, ResizableMediaItem, Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider, Path, ParsesTextFieldOptions };
export { registerComponents };
export { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField, useHasMaxChars, useSearches, useRepeaterField };
export { sliceMessageBag, spliceMessageBag, messageBagToString }
export { startCase, getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols };
export { TextField, TextAreaField, CheckboxField, CheckboxesField, CurrencyField, DateField, NumberField, ToggleField, RepeaterField, RepeaterRow, RadioField, SearchField, SelectField, CustomSelectField, HtmlField, FlexibleContentField, LinkField, FieldWrapper, FieldGroup };
export { MediaPreview, MediaLibrary, MediaDetails, MediaField };
export { PasswordStrengthMeter, PasswordField, TimeField, CompoundField, RepeaterTableField, RepeaterTableRow };

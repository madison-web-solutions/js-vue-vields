import { defineAsyncComponent } from 'vue';

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
import { getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols } from '@/lib/util';
import { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField } from '@/lib/field';
import { useSearches } from '@/lib/search';
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

const HtmlField = defineAsyncComponent(() => import('@/components/HtmlField.vue'));

export type { CompoundFormValue, RepeaterFormValue, FormValue, MessageBag, BooleansMap, KeysList, MediaItem, ResizableMediaItem, Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider, Path, ParsesTextFieldOptions };
export { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField, useSearches }
export { sliceMessageBag, spliceMessageBag, messageBagToString }
export { getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols };
export { TextField, TextAreaField, CheckboxField, CheckboxesField, CurrencyField, DateField, NumberField, ToggleField, RepeaterField, RepeaterRow, RadioField, SearchField, SelectField, HtmlField, FlexibleContentField, LinkField, FieldWrapper, FieldGroup };
export { MediaPreview, MediaLibrary, MediaDetails, MediaField };
export { PasswordStrengthMeter, PasswordField };

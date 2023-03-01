import { defineAsyncComponent, ref } from 'vue';
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

import type { CompoundFormValue, RepeaterFormValue, FormValue, Path, AppConfigOptions } from '@/lib/util';
import type { MessageBag } from '@/lib/MessageBag';
import type { Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider } from '@/lib/search';
import type { MediaItem, ResizableMediaItem } from '@/lib/media';
import type { BooleansMap, KeysList, UseFormFieldOpts, ParsesTextFieldOptions } from '@/lib/field';
import { sliceMessageBag, spliceMessageBag, messageBagToString } from '@/lib/MessageBag';
import { startCase, getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols } from '@/lib/util';
import { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField } from '@/lib/field';
import { useHasMaxChars } from '@/lib/text';
import { useSearches } from '@/lib/search';
import { useRepeaterField } from '@/lib/repeater';
import usePopperTooltip from '@/lib/usePopperTooltip';
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
    FieldGroup,
    PasswordStrengthMeter,
    PasswordField,
    TimeField,
    CompoundField,
    RepeaterTableField,
    MediaPreview,
    MediaLibrary,
    MediaDetails,
    MediaField,
};

const registerComponents = (app: App, prefix?: string | null | undefined) => {
    const _prefix: string = (prefix == null ? '' : prefix);
    for (const name in publicComponents) {
        app.component(_prefix + name, publicComponents[name]);
    }
};
const configureApp = (app: App, config: AppConfigOptions) => {
    app.provide(symbols.fieldWrapperComponent, config.fieldWrapperComponent);
    app.provide(symbols.textAreaDefaultNumRows, ref(config.textAreaDefaultNumRows));
    app.provide(symbols.defaultShowCurrencyCodes, ref(config.defaultShowCurrencyCodes));

    const cssPrefix = config.cssPrefix || '';
    const normalizeClassList = (arg: any): string[] => {
        const classList = [];
        if (arg == null || arg == '') {
            // nothing
        } else if (typeof arg == 'string') {
            classList.push(...arg.split(/\s+/));
        } else if (Array.isArray(arg)) {
            classList.push(...arg);
        } else {
            for (const [key, condition] of Object.entries(arg)) {
                if (condition) {
                    classList.push(String(key));
                }
            }
        }
        return classList.map((className) => cssPrefix + className);
    };
    app.directive('pclass', {
        mounted: (el, binding) => {
            const classes =
            el.classList.add(...normalizeClassList(binding.value));
        },
        updated: (el, binding) => {
            if (binding.value != binding.oldValue) {
                el.classList.remove(...normalizeClassList(binding.oldValue));
                el.classList.add(...normalizeClassList(binding.value));
            }
        },
    });
};

export type { CompoundFormValue, RepeaterFormValue, FormValue, MessageBag, BooleansMap, KeysList, UseFormFieldOpts, MediaItem, ResizableMediaItem, Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider, MediaProvider, PasswordStrengthProvider, Path, ParsesTextFieldOptions };
export { registerComponents, configureApp };
export { commonProps, useFormField, useHasChoices, useHasChoicesSingle, useHasChoicesMultiple, useParsesTextField, useHasMaxChars, useSearches, useRepeaterField, usePopperTooltip };
export { sliceMessageBag, spliceMessageBag, messageBagToString }
export { startCase, getUniqueKey, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols };
export { TextField, TextAreaField, CheckboxField, CheckboxesField, CurrencyField, DateField, NumberField, ToggleField, RepeaterField, RepeaterRow, RadioField, SearchField, SelectField, CustomSelectField, HtmlField, FlexibleContentField, LinkField, FieldWrapper, FieldGroup };
export { MediaPreview, MediaLibrary, MediaDetails, MediaField };
export { PasswordStrengthMeter, PasswordField, TimeField, CompoundField, RepeaterTableField, RepeaterTableRow };

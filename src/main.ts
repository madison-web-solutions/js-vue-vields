import { defineAsyncComponent, ref } from 'vue';
import type { App, Component } from 'vue';

import type {
    AppConfigOptions,
    BooleansMap,
    ChoicesProvider,
    Choosable,
    CompoundFormValue,
    Config,
    ConfigKey,
    EditMode,
    FieldEmitType,
    FixedLens,
    FormValue,
    IndexedLens,
    KeysList,
    Lens,
    LinkAlias,
    LinksProvider,
    LookupFound,
    LookupNotFound,
    LookupResult,
    MediaItem,
    MediaProvider,
    MessageBag,
    NamedLens,
    ParsesTextFieldOptions,
    PasswordStrengthProvider,
    Path,
    PendingChoosable,
    RepeaterFormValue,
    RepeaterItem,
    RepeaterTableCol,
    RepeaterTableColOpts,
    ResizableMediaItem,
    ScalarFormValue,
    SearchResultPage,
    UpdateFailed,
    UpdateOk,
    UpdateResult,
    UseFormFieldOpts,
    UseFormFieldPropRefs,
    UseFormFieldHasChoicesMultiplePropRefs,
    UseHasChoicesPropRefs,
    UseHasMaxCharsPropRefs,
    UseRepeaterFieldPropRefs,
} from '@/lib/types';

import { sliceMessageBag, spliceMessageBag, messageBagToString } from '@/lib/MessageBag';
import { startCase, getUniqueKey, coerceToScalarFormValue, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, coerceToBooleansNativeMap, coerceToKeysList, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors } from '@/lib/util';
import { commonProps, useExtendsPath, useFormField, useExtendsConfig, useExtendsEditMode, useHasCompoundValue, useHasChoices, useHasChoicesSingle, useFormFieldWithChoicesMultiple, useParsesTextField } from '@/lib/field';
import { defaultConfig, getConfigValue, getConfigRef } from '@/lib/config';
import { symbols } from '@/lib/symbols';
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
import RadioField from '@/components/RadioField.vue';
import SearchField from '@/components/SearchField.vue';
import SelectField from '@/components/SelectField.vue';
import CustomSelectField from '@/components/CustomSelectField.vue';
import FlexibleContentField from '@/components/FlexibleContentField.vue';
import LinkField from "@/components/LinkField.vue";
import FieldWrapper from '@/components/FieldWrapper.vue';
import FieldGroup from '@/components/FieldGroup.vue';
import FieldArray from '@/components/FieldArray.vue';
import FieldArrayItem from '@/components/FieldArrayItem.vue';
import MediaPreview from '@/components/media/MediaPreview.vue';
import MediaLibrary from '@/components/media/MediaLibrary.vue';
import MediaDetails from '@/components/media/MediaDetails.vue';
import MediaField from '@/components/media/MediaField.vue';
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter.vue';
import PasswordField from '@/components/PasswordField.vue';
import TimeField from '@/components/TimeField.vue';
import CompoundField from '@/components/CompoundField.vue';
import RepeaterTableField from "@/components/RepeaterTableField.vue";
import TokensField from "@/components/TokensField.vue";
import Modal from "@/components/Modal.vue";
import EmptyFieldWrapper from "@/components/EmptyFieldWrapper.vue";
import DateTimeField from "@/components/DateTimeField.vue";

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
    FieldArray,
    PasswordStrengthMeter,
    PasswordField,
    TimeField,
    CompoundField,
    RepeaterTableField,
    MediaPreview,
    MediaLibrary,
    MediaDetails,
    MediaField,
    TokensField,
    DateTimeField,
};

const registerComponents = (app: App, prefix?: string | null | undefined) => {
    const _prefix: string = (prefix == null ? '' : prefix);
    for (const name in publicComponents) {
        app.component(_prefix + name, publicComponents[name]);
    }
};
const configureApp = (app: App, config: AppConfigOptions) => {
    app.provide(symbols.fieldWrapperComponent, config.fieldWrapperComponent);

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
            el.classList.add(...normalizeClassList(binding.value));
        },
        updated: (el, binding) => {
            if (binding.value != binding.oldValue) {
                el.classList.remove(...normalizeClassList(binding.oldValue));
            }
            el.classList.add(...normalizeClassList(binding.value));
        },
    });

    app.provide(symbols.config, ref(config));
};

export type {
    AppConfigOptions,
    BooleansMap,
    ChoicesProvider,
    Choosable,
    CompoundFormValue,
    Config,
    ConfigKey,
    EditMode,
    FieldEmitType,
    FixedLens,
    FormValue,
    IndexedLens,
    KeysList,
    Lens,
    LinkAlias,
    LinksProvider,
    LookupFound,
    LookupNotFound,
    LookupResult,
    MediaItem,
    MediaProvider,
    MessageBag,
    NamedLens,
    ParsesTextFieldOptions,
    PasswordStrengthProvider,
    Path,
    PendingChoosable,
    RepeaterFormValue,
    RepeaterItem,
    RepeaterTableCol,
    RepeaterTableColOpts,
    ResizableMediaItem,
    ScalarFormValue,
    SearchResultPage,
    UpdateFailed,
    UpdateOk,
    UpdateResult,
    UseFormFieldOpts,
    UseFormFieldPropRefs,
    UseFormFieldHasChoicesMultiplePropRefs,
    UseHasChoicesPropRefs,
    UseHasMaxCharsPropRefs,
    UseRepeaterFieldPropRefs,
};

export { registerComponents, configureApp };
export { commonProps, useExtendsPath, useFormField, useExtendsConfig, useExtendsEditMode, useHasCompoundValue, useHasChoices, useHasChoicesSingle, useFormFieldWithChoicesMultiple, useParsesTextField, useHasMaxChars, useSearches, useRepeaterField, usePopperTooltip };
export { sliceMessageBag, spliceMessageBag, messageBagToString }
export { startCase, getUniqueKey, coerceToScalarFormValue, coerceToCompoundFormValue, coerceToRepeaterFormValue, coerceToArrayKey, coerceToBooleansNativeMap, coerceToKeysList, copyCompoundFormValue, copyRepeaterFormValue, coerceToBoolean, reindexErrors, symbols };
export { defaultConfig, getConfigValue, getConfigRef };
export { TextField, TextAreaField, CheckboxField, CheckboxesField, CurrencyField, DateField, NumberField, ToggleField, RepeaterField, RadioField, SearchField, SelectField, CustomSelectField, HtmlField, FlexibleContentField, LinkField, FieldWrapper, FieldGroup, FieldArray, FieldArrayItem };
export { MediaPreview, MediaLibrary, MediaDetails, MediaField };
export { PasswordStrengthMeter, PasswordField, TimeField, CompoundField, RepeaterTableField, TokensField, Modal, EmptyFieldWrapper, DateTimeField };

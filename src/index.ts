import { defineAsyncComponent } from "vue";

import type {
  // General
  Dict,
  MessageBag,
  EditMode,
  Path,
  // Form value shapes
  ScalarFormValue,
  KeyListFormValue,
  BooleansMapFormValue,
  CompoundFormValue,
  RepeaterFormValue,
  FormValue,
  // Choices
  Choosable,
  PendingChoosable,
  // Provider support types
  LookupFound,
  LookupNotFound,
  LookupResult,
  UpdateResult,
  SearchResultPage,
  LinkAlias,
  MediaItem,
  MediaItemWithThumbnail,
  UploadedFileInfo,
  UploadedFileCache,
  UploadedFileCacheEntry,
  // Provider interfaces
  ChoicesProvider,
  LinksProvider,
  MediaProvider,
  UploadProvider,
  PasswordStrengthProvider,
  // Field building blocks (for authoring custom fields / repeaters)
  FieldProps,
  FieldState,
  FieldEmitType,
  EnterPressEmitType,
  RepeaterFieldProps,
  HasChoicesFieldProps,
  HasChoicesMultipleFieldProps,
  HasMaxCharsFieldProps,
  UsesSearchesFieldProps,
  ParsesTextFieldOptions,
  RepeaterItem,
  RepeaterTableColOpts,
  RepeaterTableCol,
  // Config / plugin
  Config,
  ConfigKey,
  VueFieldsMsPluginOptions,
} from "./types";

import injectionSymbols from "./lib/injection-symbols";

import {
  isArrayKey,
  coerceToArrayKey,
  coerceToBoolean,
  coerceToScalarFormValue,
  coerceToKeyListFormValue,
  coerceToRepeaterFormValue,
  coerceToCompoundFormValue,
  coerceToFormValue,
  copyCompoundFormValue,
  copyRepeaterFormValue,
  copyKeyListFormValue,
  copyFormValue,
  valueAtPath,
  arrayInsert,
  arrayAppend,
  arrayRemove,
  arrayMove,
  arraySwap,
} from "./lib/type-utils";

import { reindexErrors } from "./lib/message-bag";

import { startCase, pickPropsFor } from "./lib/utils";

import { getCurrentValue, getCurrentErrors } from "./lib/current-context";
import { provideFormValues, provideFormValuesAt } from "./lib/context";

// Core field composables. These are the building blocks the shipped fields are made from, and
// are exported so consumers can author their own field / repeater / choice / container variants.
import useFormField from "./lib/useFormField";
import useHasMaxChars from "./lib/useHasMaxChars";
import useHasChoices from "./lib/useHasChoices";
import useHasChoicesSingle from "./lib/useHasChoicesSingle";
import useFormFieldWithChoicesMultiple from "./lib/useFormFieldWithChoicesMultiple";
import useRepeaterField from "./lib/useRepeaterField";
import useSearches from "./lib/useSearches";
import useParsesTextField from "./lib/useParsesTextField";
import useExtendsPath from "./lib/useExtendsPath";
import useExtendsEditMode from "./lib/useExtendsEditMode";
import useExtendsConfig from "./lib/useExtendsConfig";
import useUploadedFiles from "./lib/useUploadedFiles";

import CheckboxesField from "./components/CheckboxesField.vue";
import CheckboxField from "./components/CheckboxField.vue";
import CompoundField from "./components/CompoundField.vue";
import CurrencyField from "./components/CurrencyField.vue";
import CustomRadioField from "./components/CustomRadioField.vue";
import CustomSelectField from "./components/CustomSelectField.vue";
import DateField from "./components/DateField.vue";
import DateTimeField from "./components/DateTimeField.vue";
import FieldArray from "./components/FieldArray.vue";
import FieldArrayItem from "./components/FieldArrayItem.vue";
import FieldGroup from "./components/FieldGroup.vue";
import FieldWrapper from "./components/FieldWrapper.vue";
import LinkField from "./components/LinkField.vue";
import FlexibleContentField from "./components/FlexibleContentField.vue";
import NumberField from "./components/NumberField.vue";
import PasswordField from "./components/PasswordField.vue";
import PasswordStrengthMeter from "./components/PasswordStrengthMeter.vue";
import RadioField from "./components/RadioField.vue";
import RepeaterField from "./components/RepeaterField.vue";
import RepeaterTableField from "./components/RepeaterTableField.vue";
import SearchInterface from "./components/SearchInterface.vue";
import SearchField from "./components/SearchField.vue";
import SelectField from "./components/SelectField.vue";
import TextAreaField from "./components/TextAreaField.vue";
import TextField from "./components/TextField.vue";
import TimeField from "./components/TimeField.vue";
import TimestampField from "./components/TimestampField.vue";
import ToggleField from "./components/ToggleField.vue";
import TokensField from "./components/TokensField.vue";
import FileUploadField from "./components/FileUploadField.vue";

import MediaField from "./components/media/MediaField.vue";
import MediaDetails from "./components/media/MediaDetails.vue";
import MediaLibrary from "./components/media/MediaLibrary.vue";
import MediaPreview from "./components/media/MediaPreview.vue";

const HtmlField = defineAsyncComponent(
  () => import("./components/HtmlField.vue"),
);

import { vueFieldsMsPlugin } from "./vuePlugin";

export type {
  // General
  Dict,
  MessageBag,
  EditMode,
  Path,
  // Form value shapes
  ScalarFormValue,
  KeyListFormValue,
  BooleansMapFormValue,
  CompoundFormValue,
  RepeaterFormValue,
  FormValue,
  // Choices
  Choosable,
  PendingChoosable,
  // Provider support types
  LookupFound,
  LookupNotFound,
  LookupResult,
  UpdateResult,
  SearchResultPage,
  LinkAlias,
  MediaItem,
  MediaItemWithThumbnail,
  UploadedFileInfo,
  UploadedFileCache,
  UploadedFileCacheEntry,
  // Provider interfaces
  ChoicesProvider,
  LinksProvider,
  MediaProvider,
  UploadProvider,
  PasswordStrengthProvider,
  // Field building blocks (for authoring custom fields / repeaters)
  FieldProps,
  FieldState,
  FieldEmitType,
  EnterPressEmitType,
  RepeaterFieldProps,
  HasChoicesFieldProps,
  HasChoicesMultipleFieldProps,
  HasMaxCharsFieldProps,
  UsesSearchesFieldProps,
  ParsesTextFieldOptions,
  RepeaterItem,
  RepeaterTableColOpts,
  RepeaterTableCol,
  // Config / plugin
  Config,
  ConfigKey,
  VueFieldsMsPluginOptions,
};

export {
  injectionSymbols,

  // Value / error helpers
  isArrayKey,
  coerceToArrayKey,
  coerceToBoolean,
  coerceToScalarFormValue,
  coerceToKeyListFormValue,
  coerceToRepeaterFormValue,
  coerceToCompoundFormValue,
  coerceToFormValue,
  copyCompoundFormValue,
  copyRepeaterFormValue,
  copyKeyListFormValue,
  copyFormValue,
  reindexErrors,
  startCase,
  valueAtPath,
  arrayInsert,
  arrayAppend,
  arrayRemove,
  arrayMove,
  arraySwap,
  pickPropsFor,
  getCurrentValue,
  getCurrentErrors,
  provideFormValues,
  provideFormValuesAt,

  // Composables (field building blocks)
  useFormField,
  useHasMaxChars,
  useHasChoices,
  useHasChoicesSingle,
  useFormFieldWithChoicesMultiple,
  useRepeaterField,
  useSearches,
  useParsesTextField,
  useExtendsPath,
  useExtendsEditMode,
  useExtendsConfig,
  useUploadedFiles,

  // Components
  CheckboxesField,
  CheckboxField,
  CompoundField,
  CurrencyField,
  CustomRadioField,
  CustomSelectField,
  DateField,
  DateTimeField,
  FieldArray,
  FieldArrayItem,
  FieldGroup,
  FieldWrapper,
  FlexibleContentField,
  LinkField,
  NumberField,
  PasswordField,
  PasswordStrengthMeter,
  RadioField,
  RepeaterField,
  RepeaterTableField,
  SearchInterface,
  SearchField,
  SelectField,
  TextAreaField,
  TextField,
  TimeField,
  TimestampField,
  ToggleField,
  TokensField,
  FileUploadField,

  MediaField,
  MediaDetails,
  MediaLibrary,
  MediaPreview,

  HtmlField,

  vueFieldsMsPlugin,
};

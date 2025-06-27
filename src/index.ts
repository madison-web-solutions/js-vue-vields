import type {
  Dict,
  MessageBag,
  ScalarFormValue,
  KeyListFormValue,
  CompoundFormValue,
  RepeaterFormValue,
  FormValue,
  Path,
  FixedLens,
  IndexedLens,
  NamedLens,
  Lens,
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
} from "./lib/type-utils";

import {
  reindexErrors,
  startCase,
  valueAtPath,
} from "./lib/utils";

import useFormField from "./lib/useFormField";
import useHasCompoundValue from "./lib/useHasCompoundValue";
import useHasMaxChars from "./lib/useHasMaxChars";
import useExtendsPath from "./lib/useExtendsPath";

import CheckboxesField from "./components/CheckboxesField.vue";
import CheckboxField from "./components/CheckboxField.vue";
import CompoundField from "./components/CompoundField.vue";
import CurrencyField from "./components/CurrencyField.vue";
import CustomRadioField from "./components/CustomRadioField.vue";
import CustomSelectField from "./components/CustomSelectField.vue";
import DateField from "./components/DateField.vue";
import FieldArray from "./components/FieldArray.vue";
import FieldArrayItem from "./components/FieldArrayItem.vue";
import FieldGroup from "./components/FieldGroup.vue";
import FieldWrapper from "./components/FieldWrapper.vue";
import NumberField from "./components/NumberField.vue";
import PasswordField from "./components/PasswordField.vue";
import PasswordStrengthMeter from "./components/PasswordStrengthMeter.vue";
import RadioField from "./components/RadioField.vue";
import RepeaterField from "./components/RepeaterField.vue";
import SearchInterface from "./components/SearchInterface.vue";
import SearchField from "./components/SearchField.vue";
import SelectField from "./components/SelectField.vue";
import TextAreaField from "./components/TextAreaField.vue";
import TextField from "./components/TextField.vue";
import TimeField from "./components/TimeField.vue";
import ToggleField from "./components/ToggleField.vue";

export type {
  Dict,
  MessageBag,
  ScalarFormValue,
  KeyListFormValue,
  CompoundFormValue,
  RepeaterFormValue,
  FormValue,
  Path,
  FixedLens,
  IndexedLens,
  NamedLens,
  Lens,
};

export {
  injectionSymbols,
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
  useFormField,
  useHasCompoundValue,
  useHasMaxChars,
  useExtendsPath,
  CheckboxesField,
  CheckboxField,
  CompoundField,
  CurrencyField,
  CustomRadioField,
  CustomSelectField,
  DateField,
  FieldArray,
  FieldArrayItem,
  FieldGroup,
  FieldWrapper,
  NumberField,
  PasswordField,
  PasswordStrengthMeter,
  RadioField,
  RepeaterField,
  SearchInterface,
  SearchField,
  SelectField,
  TextAreaField,
  TextField,
  TimeField,
  ToggleField,
};

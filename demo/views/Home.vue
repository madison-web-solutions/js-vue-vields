<template>
    <div class="container">
        <h1>Demo App</h1>
        <div class="row">
            <div class="col-8 overflow-hidden">
                <FieldGroup v-model="vals" v-model:errors="errors" :config="config">
                    <div class="row g-3 mb-4">
                        <DateTimeField label="Check In" name="check_in" class="col-6" />
                        <DateTimeField label="Check Out" name="check_out" class="col-6" />
                        <TimestampField label="Transaction Time" name="transaction_time" class="col-6" />
                        <div class="col-6"></div>
                        <MediaField label="Image" name="image" class="col-6" />
                        <CustomSelectField label="Color" name="color" directory="colors" class="col-6">
                            <template v-slot="{ choice }">
                                <div :style="{display: 'inline-block', width: '10px', height: '10px', 'background-color': '#' + (choice as Color).hex}" class="me-2"></div>
                                {{ choice.label }}
                            </template>
                        </CustomSelectField>
                        <CheckboxField label="Very Derris" name="derris" :inlineLabel="true" class="col-6" ref="derrisField" />
                        <CheckboxField label="Derrisson" name="derrisson" :inlineLabel="false" class="col-6" />
                        <hr />
                        <LinkField label="Link" name="link" class="col-12" />
                        <hr />
                        <TextField label="First Name" name="first_name" class="col-md-6" />
                        <TextField label="Last Name" name="last_name" class="col-md-6" ref="lastNameField" />
                        <PasswordField label="Password" name="password" :minStrength="3" class="col-12" />
                        <TextAreaField label="Summary" name="summary" :max="155" class="col-12" />
                        <RadioField label="Type" name="type" choices="new,existing" class="col-12" />
                        <RepeaterField label="Pets" name="pets" :min="3" :max="5" class="col-12">
                            <div class="row">
                                <TextField label="Name" name="name" class="col-md-4" />
                                <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                                <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            </div>
                        </RepeaterField>
                        <TimeField label="Opening Time" name="opening_time" min="06:30" max="19:00" class="col-md-4" />
                        <DateField label="Date of Birth" name="dob" max="today" class="col-md-4" />
                        <DateField label="Date in 2024" name="date_in_2024" min="2024-01-01" max="2024-12-31" class="col-md-4" />
                        <NumberField label="Days Holiday" name="days_holiday" :min="0" :step="1" class="col-md-4" ref="daysHolidayField" />
                        <NumberField label="Area" name="area" :min="0" unit="m²" class="col-md-4" ref="areaField" />
                        <CurrencyField label="Salary" name="salary" class="col-md-4" ref="salaryField" />
                        <hr />
                        <TextField label="Short Description" name="short_description" :max="20" class="col-md-6" help="20 character max" />
                        <HtmlField label="Description" name="description" class="col-12" ref="descriptionField" />
                        <hr />
                        <FlexibleContentField label="Page Sections" name="page_sections" :sectionChoices="[{key: 'banner', label: 'Banner'}, {key: 'promos', label: 'Promos'}]" class="col-12">
                            <template #banner>
                                <div class="row g-3">
                                    <TextField label="Banner Heading" name="banner_heading" class="col-12" />
                                </div>
                            </template>
                            <template #promos>
                                <div class="row g-3">
                                    <NumberField label="Num Promos" name="num_promos" :integersOnly="true" :min="2" :max="4" class="col-6" />
                                </div>
                            </template>
                        </FlexibleContentField>
                        <hr />
                        <SearchField label="Search Cats" name="cat" directory="cats" class="col-6" tooltip="This field has a custom tooltip that you can use">
                            <template #suggestion="{ suggestion }">
                                {{ (suggestion as Cat).label }}
                                <span v-if="(suggestion as Cat).age">({{ (suggestion as Cat).age }})</span>
                            </template>
                        </SearchField>
                        <SelectField label="Select Cat" name="cat" directory="cats" class="col-6" />
                        <ToggleField label="Inline Checks" name="inline_checks" class="col-12" />
                        <RadioField label="Select Cat" name="cat" directory="cats" :inline="!!vals.inline_checks" :class="vals.inline_checks ? 'col-12' : 'col-6'" />
                        <CheckboxesField label="Select Cats (Arr)" name="cats_arr" directory="cats" valueIs="array" :inline="!!vals.inline_checks" :class="vals.inline_checks ? 'col-12' : 'col-6'" />
                        <CheckboxesField label="Select Cats (Obj)" name="cats_obj" directory="cats" valueIs="object" :inline="!!vals.inline_checks" :class="vals.inline_checks ? 'col-12' : 'col-6'" />

                        <CompoundField label="Address" name="address" class="col-12">
                            <div class="card">
                                <div class="card-body">
                                    <div class="row g-3">
                                        <TextField label="Line 1" name="line1" class="col-md-6" />
                                        <TextField label="Line 2" name="line2" class="col-md-6" />
                                        <TextField label="City" name="city" class="col-md-6" />
                                        <TextField label="Postcode" name="postcode" class="col-md-6" />
                                    </div>
                                </div>
                            </div>
                        </CompoundField>

                        <CompoundField label="Single Call To Action" name="single_cts" class="col-12">
                            <CallToActionFields />
                        </CompoundField>

                        <RepeaterField label="Repeater Call To Action" name="repeater_cts" class="col-12">
                            <CallToActionFields />
                        </RepeaterField>
                    </div>
                </FieldGroup>
            </div>
            <div class="col-4">
                <p>
                    <button type="button" class="btn btn-primary" @click="toggleEditMode">{{ editMode == 'edit' ? 'Stop Editing' : 'Edit' }}</button>
                    <button type="button" class="btn btn-link" @click="focusAField">Test Field Focusing</button>
                </p>
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, provide } from "vue";
import { symbols, FieldGroup, CheckboxField, CheckboxesField, TextField, TextAreaField, SelectField, CustomSelectField, HtmlField, CurrencyField, NumberField, ToggleField, RepeaterField, SearchField, RadioField, DateField, LinkField, MediaField, PasswordField, TimeField, CompoundField, FlexibleContentField, DateTimeField, TimestampField } from "vue-fields-ms";
import CallToActionFields from "../components/CallToActionFields.vue";

const editMode = ref<'edit'|'view'>('edit');
const toggleEditMode = () => {
    editMode.value = (editMode.value == 'edit' ? 'view' : 'edit');
};
provide(symbols.editMode, editMode);

const vals = ref({
    transaction_time: 1678258688118,
    first_name: 'Jane',
    last_name: 'Doe',
    summary: "A wonderful person.\nKind and caring.",
    pets: [
        {name: 'Gary', type: 'cat'},
        {name: 'Waffles', type: 'cat'}
    ],
    days_holiday: 20,
    area: 4.5,
    salary: 4200000,
    description: '<h3>Hobbies</h3><ul><li>Trampolining</li><li>Knitting</li></ul>',
    page_sections: [
        {
            content_type: 'banner',
            banner_heading: 'About Us',
        }
    ],
    inline_checks: false,
    cats_arr: [3, 6, 11],
    cats_obj: {6: true},
});

type Cat = {
    key: number,
    label: string,
    age?: number,
};

type Color = {
    key: string,
    label: string,
    hex: string,
};

const errors = ref({
    'first_name': ['Some kind of error here'],
    'summary': ['Some kind of error here'],
    'description': ['Some kind of error here'],
    'cats_arr.1': ['Barbura Barbura'],
    'cats_obj.6': ['Barbura Barbura'],
    'transaction_time': ['Incorrect time'],
    'check_in': ['An error'],
});

const config = ref({
    'currency.currencyCode': 'GBP',
    'textArea.numRows': 4,
});


// Test focus() functionality on different field types
const lastNameField = ref<InstanceType<typeof TextField>|null>(null);
const derrisField = ref<InstanceType<typeof CheckboxField>|null>(null);
const descriptionField = ref<InstanceType<typeof HtmlField>|null>(null);
const daysHolidayField = ref<InstanceType<typeof NumberField>|null>(null);
const areaField = ref<InstanceType<typeof NumberField>|null>(null);
const salaryField = ref<InstanceType<typeof CurrencyField>|null>(null);
const focusableFields = [lastNameField, derrisField, descriptionField, daysHolidayField, areaField, salaryField];
let focusFieldCounter = 0;
const focusAField = () => {
    const field = focusableFields[focusFieldCounter++ % focusableFields.length];
    field.value && field.value.focus();
};

</script>

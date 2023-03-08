<template>
    <div class="container">
        <h1>Demo App</h1>
        <div class="row">
            <div class="col-8 overflow-hidden">
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <div class="row g-3 mb-4">
                        <MediaField label="Image" name="image" class="col-6" />
                        <CustomSelectField label="Color" name="color" directory="colors" class="col-6">
                            <template v-slot="{ choice }">
                                <div :style="{display: 'inline-block', width: '10px', height: '10px', 'background-color': '#' + (choice as Color).hex}" class="me-2"></div>
                                {{ choice.label }}
                            </template>
                        </CustomSelectField>
                        <CheckboxField label="Very Derris" name="derris" :inlineLabel="true" class="col-6" />
                        <CheckboxField label="Derrisson" name="derrisson" :inlineLabel="false" class="col-6" />
                        <hr />
                        <LinkField label="Link" name="link" class="col-12" />
                        <hr />
                        <TextField label="First Name" name="first_name" class="col-md-6" />
                        <TextField label="Last Name" name="last_name" class="col-md-6" />
                        <PasswordField label="Password" name="password" :minStrength="3" class="col-12" />
                        <TextAreaField label="Summary" name="summary" :rows="3" :max="155" class="col-12" />
                        <RadioField label="Type" name="type" choices="new,existing" class="col-12" />
                        <RepeaterField label="Pets" name="pets" :min="3" :max="5" class="col-12">
                            <div class="row">
                                <TextField label="Name" name="name" class="col-md-4" />
                                <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                                <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            </div>
                        </RepeaterField>
                        <TimeField label="Opening Time" name="opening_time" min="06:30" max="19:00" class="col-md-6" />
                        <DateField label="Date of Birth" name="dob" max="today" class="col-md-6" />
                        <NumberField label="Days Holiday" name="days_holiday" :min="0" :step="1" class="col-md-4" />
                        <NumberField label="Area" name="area" :min="0" unit="m²" class="col-md-4" />
                        <CurrencyField label="Salary" name="salary" currencyCode="GBP" class="col-md-4" />
                        <hr />
                        <TextField label="Short Description" name="short_description" :max="20" class="col-md-6" help="20 character max" />
                        <HtmlField label="Description" name="description" class="col-12" />
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
                        <CheckboxesField label="Select Cats" name="cats" directory="cats" :inline="!!vals.inline_checks" :class="vals.inline_checks ? 'col-12' : 'col-6'" />
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
                    </div>
                </FieldGroup>
            </div>
            <div class="col-4">
                <p><button type="button" class="btn btn-primary" @click="toggleEditMode">{{ editMode == 'edit' ? 'Stop Editing' : 'Edit' }}</button></p>
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, provide } from "vue";
import { FieldGroup, CheckboxField, CheckboxesField, TextField, TextAreaField, SelectField, CustomSelectField, HtmlField, CurrencyField, NumberField, ToggleField, RepeaterField, SearchField, RadioField, DateField, LinkField, MediaField, PasswordField, TimeField, CompoundField, FlexibleContentField, RepeaterTableField } from "@/main";
import { symbols } from '@/main';

const editMode = ref('edit');
const toggleEditMode = () => {
    editMode.value = (editMode.value == 'edit' ? 'view' : 'edit');
};
provide(symbols.editMode, editMode);

const vals = ref({
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
});

</script>

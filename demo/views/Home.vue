<template>
    <div class="container">
        <h1>Demo App</h1>
        <div class="row">
            <div class="col-8">
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <div class="row g-3 mb-4">
                        <MediaField label="Image" name="image" class="col-12" />

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
                        <NumberField label="Days Holiday" name="days_holiday" :min="0" class="col-md-6" />
                        <CurrencyField label="Salary" name="salary" currencyCode="GBP" class="col-md-6" />
                        <hr />
                        <TextField label="Short Description" name="short_description" :max="20" class="col-md-6" />
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
                        <SearchField label="Search Cats" name="cat" directory="cats" class="col-6">
                            <template #suggestion="{ suggestion }">
                                {{ (suggestion as Cat).label }}
                                <span v-if="(suggestion as Cat).age">({{ (suggestion as Cat).age }})</span>
                            </template>
                        </SearchField>
                        <SelectField label="Select Cat" name="cat" directory="cats" class="col-6" />
                        <RadioField label="Select Cat" name="cat" directory="cats" class="col-6" />
                        <CheckboxesField label="Select Cats" name="cats" directory="cats" class="col-6" />
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
                <pre>{{ vals }}</pre>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { FieldGroup, CheckboxField, CheckboxesField, TextField, SelectField, HtmlField, CurrencyField, NumberField, ToggleField, RepeaterField, SearchField, RadioField, DateField, LinkField, MediaField, PasswordField, TimeField, CompoundField, RepeaterTableField } from "@/main";
import TextAreaField from "@/components/TextAreaField.vue";
import FlexibleContentField from "@/components/FlexibleContentField.vue";

const vals = ref({
    first_name: 'Jane',
    last_name: 'Doe',
    summary: "A wonderful person.\nKind and caring.",
    pets: [
        {name: 'Gary', type: 'cat'},
        {name: 'Waffles', type: 'cat'}
    ],
    days_holiday: 20,
    salary: 4200000,
    description: '<h3>Hobbies</h3><ul><li>Trampolining</li><li>Knitting</li></ul>',
    page_sections: [
        {
            content_type: 'banner',
            banner_heading: 'About Us',
        }
    ]
});

type Cat = {
    key: number,
    label: string,
    age?: number,
};

const errors = ref({
    'first_name': ['Some kind of error here'],
    'summary': ['Some kind of error here'],
    'description': ['Some kind of error here'],
});

</script>

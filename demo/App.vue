<template>
    <div class="container">
        <h1>Demo App</h1>
        <div class="row">
            <div class="col-8">
                <FieldGroup v-model="vals" v-model:errors="errors">
                    <div class="row g-3">
                        <TextField label="First Name" name="first_name" class="col-md-6" />
                        <TextField label="Last Name" name="last_name" class="col-md-6" />
                        <TextAreaField label="Summary" name="summary" :rows="3" class="col-12" />
                        <RadioField label="Type" name="type" choices="new,existing" class="col-12" />
                        <RepeaterField label="Pets" name="pets" class="col-12">
                            <div class="row">
                                <TextField label="Name" name="name" class="col-md-4" />
                                <SelectField label="Type" name="type" choices="cat,dog,fish" class="col-md-4" />
                                <CheckboxesField label="Attributes" name="attributes" choices="cute,stupid,fat" class="col-md-4" />
                            </div>
                        </RepeaterField>
                        <DateField label="Date of Birth" name="dob" max="today" class="col-md-4" />
                        <NumberField label="Days Holiday" name="days_holiday" :min="0" class="col-md-4" />
                        <CurrencyField label="Salary" name="salary" currencyCode="GBP" class="col-md-4" />
                        <hr />
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
                                {{ suggestion.label }}
                                <span v-if="(suggestion as any).age">({{ (suggestion as any).age }})</span>
                            </template>
                        </SearchField>
                        <SelectField label="Select Cat" name="cat" directory="cats" class="col-6" />
                        <RadioField label="Select Cat" name="cat" directory="cats" class="col-6" />
                        <CheckboxesField label="Select Cats" name="cats" directory="cats" class="col-6" />
                        <hr />
                        <LinkField label="Link" name="link" class="col-6" />
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
import type { Choosable, LinkAlias, SearchResultPage, ChoicesProvider, LinksProvider } from "@/main";
import { computed, ref, provide } from "vue";
import { symbols } from '@/main';
import { FieldGroup, CheckboxField, CheckboxesField, TextField, SelectField, HtmlField, CurrencyField, NumberField, ToggleField, RepeaterField, SearchField, RadioField, DateField, LinkField } from "@/main";
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

const cats: Cat[] = [
    {key: 1, label: 'Gary', age: 5},
    {key: 2, label: 'Waffles', age: 2},
    {key: 3, label: 'Eggs'} ,
    {key: 4, label: 'Bacon'} ,
    {key: 5, label: 'Stop It', age: 3} ,
    {key: 6, label: 'Barbera'},
    {key: 7, label: 'Lloyd'},
    {key: 8, label: 'Johnson', age: 16},
    {key: 9, label: 'Butter'},
    {key: 10, label: 'Dame Judy'},
    {key: 11, label: 'Elton'},
    {key: 12, label: 'Samuel L Jackson'},
];

const dummyChoicesProvider = ref<ChoicesProvider>({
    getAll: (directory: string, extraParams?: object | undefined): Promise<Choosable[]> => {
        return new Promise<Choosable[]>((resolve, reject) => {
            window.setTimeout(() => {
                resolve(cats);
            }, 200);
        });
    },
    lookup: (directory: string, id: string | number): Promise<Choosable | null> => {
        return new Promise<Choosable | null>((resolve, reject) => {
            window.setTimeout(() => {
                for (const cat of cats) {
                    if (cat.key == id) {
                        resolve(cat);
                    }
                }
                resolve(null);
            });
        });
    },
    search: (directory: string, searchText: string, page?: number): Promise<SearchResultPage<Choosable>> => {
        return new Promise<SearchResultPage<Choosable>>((resolve, reject) => {
            window.setTimeout(() => {
                if (page == null) {
                    page = 1;
                }
                const suggestions: Choosable[] = [];
                const result: SearchResultPage<Choosable> = {page: page, hasMore: false, suggestions: suggestions};
                if (page == 1) {
                    result.suggestions = cats.slice(0, 10);
                    result.hasMore = true;
                } else if (page == 2) {
                    result.suggestions = cats.slice(10, 20);
                    result.hasMore = false;
                }
                resolve(result);
            }, 1000);
        });
    },
});

provide(symbols.choicesProvider, dummyChoicesProvider);

const catToLink = (cat: Cat): LinkAlias => {
    return {
        scheme: 'cat',
        key: String(cat.key),
        label: cat.label,
        url: 'https://www.cats.com/' + String(cat.key)
    };
};

const dummyLinksProvider = ref<LinksProvider>({
    lookup: (scheme: string, key: string): Promise<LinkAlias | null> => {
        return new Promise<LinkAlias | null>((resolve, reject) => {
            window.setTimeout(() => {
                for (const cat of cats) {
                    if (scheme === 'cat' && String(cat.key) === key) {
                        resolve(catToLink(cat));
                    }
                }
                resolve(null);
            });
        });
    },
    search: (scheme: string, searchText: string, page?: number): Promise<SearchResultPage<LinkAlias>> => {
        return new Promise<SearchResultPage<LinkAlias>>((resolve, reject) => {
            window.setTimeout(() => {
                if (page == null) {
                    page = 1;
                }
                const suggestions: LinkAlias[] = [];
                const result: SearchResultPage<LinkAlias> = {page: page, hasMore: false, suggestions: suggestions};
                if (scheme === 'cat') {
                    if (page == 1) {
                        result.suggestions = cats.slice(0, 10).map(catToLink);
                        result.hasMore = true;
                    } else if (page == 2) {
                        result.suggestions = cats.slice(10, 20).map(catToLink);
                        result.hasMore = false;
                    }
                }
                resolve(result);
            }, 1000);
        });
    },
    schemes: [
        {key: 'cat', label: 'Cat'},
        {key: 'product', label: 'Product'},
    ],
});

provide(symbols.linksProvider, dummyLinksProvider);

</script>
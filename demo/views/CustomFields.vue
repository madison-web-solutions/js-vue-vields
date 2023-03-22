<template>
    <div class="container">
        <h1>Custom Fields</h1>
        <p>As part of a FieldGroup</p>
        <FieldGroup v-model="vals">
            <div class="row g-3 mb-3">
                <TextField label="First Name" name="first_name" class="col-md-6" />
                <TextField label="Last Name" name="last_name" class="col-md-6" />
                <AddressField label="Address" name="address" class="col-12" />
            </div>
        </FieldGroup>
        <pre>{{ vals }}</pre>
        <hr />
        <p>Standalone</p>
        <CountryField label="Country" v-model="country" help="Select your country" class="mb-3" />
        <pre class="mb-3">{{ country }}</pre>
        <AddressField label="Address" v-model="address" :required="true" class="mb-3" />
        <pre>{{ address }}</pre>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FieldGroup, TextField } from 'vue-fields-ms';
import AddressField from '../components/AddressField.vue';
import CountryField from '../components/CountryField.vue';

const vals = ref({
    first_name: 'Candice',
    last_name: 'Warner',
    address: {
        add1: '10 Grantham Avenue',
        city: 'London',
    },
});

const country = ref('GB');

const address = ref({
    add1: '10 Grantham Avenue',
    city: 'London',
});

</script>
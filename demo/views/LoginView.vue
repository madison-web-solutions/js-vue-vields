<template>
  <ExampleLayout title="Login Form" :code="loginCode" :values="liveVals">
    <template #description>
      <p class="mb-0">
        A minimal sign-in form: a <code>TextField</code> for the username, a
        <code>PasswordField</code> for the (masked) password, and a
        <code>CheckboxField</code> for "remember me", all wrapped in a
        <code>FieldGroup</code> that owns the form data. Type into the fields and
        watch the live values update on the right.
      </p>
    </template>
    <template #form>
      <LoginForm ref="formRef" />
    </template>
  </ExampleLayout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import ExampleLayout from '../components/ExampleLayout.vue';
import LoginForm from '../examples/LoginForm.vue';
import loginCode from '../examples/LoginForm.vue?raw';

const formRef = ref<InstanceType<typeof LoginForm>>();

const liveVals = computed(() => formRef.value?.vals ?? {});
</script>

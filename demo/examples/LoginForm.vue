<template>
  <FieldGroup v-model="vals" v-model:errors="errors">
    <TextField name="username" label="Username" autocomplete="username" class="mb-3" />
    <PasswordField name="password" label="Password" autocomplete="current-password" class="mb-3" />
    <CheckboxField name="remember" label="Remember me" inlineLabel class="mb-3" />
    <button type="button" class="btn btn-primary" @click="onSubmit">Log In</button>
  </FieldGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { FieldGroup, TextField, PasswordField, CheckboxField } from 'vue-fields-ms';
import type { MessageBag } from 'vue-fields-ms';

const vals = ref({
  username: '',
  password: '',
  remember: false,
});

const errors = ref<MessageBag>({});

const onSubmit = () => {
  // A real app would POST these credentials to its backend here.
  window.alert(`Logging in as "${vals.value.username}" (remember me: ${vals.value.remember})`);
};

// Exposed only so the demo's "Live Values" panel can display this form's data.
defineExpose({ vals });
</script>

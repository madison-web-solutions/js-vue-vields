<template>
  <div class="vstack gap-4">
    <!-- 1. PersonCard inside a FieldGroup (named context) -->
    <section>
      <h6 class="text-uppercase text-muted small fw-bold">1. Inside a FieldGroup</h6>
      <p class="text-muted small">
        Type below — the <code>PersonCard</code> beneath the fields reads
        <code>name</code> / <code>email</code> from the surrounding
        <code>FieldGroup</code> and updates live. It receives no props.
      </p>
      <FieldGroup v-model="contact" v-model:errors="contactErrors">
        <div class="row g-2">
          <TextField name="name" label="Name" class="col-sm-6" />
          <TextField name="email" label="Email" class="col-sm-6" />
        </div>
        <div class="mt-3">
          <PersonCard />
        </div>
      </FieldGroup>
    </section>

    <!-- 2. The SAME PersonCard inside each RepeaterField row (a per-row context) -->
    <section>
      <h6 class="text-uppercase text-muted small fw-bold">2. Inside RepeaterField rows</h6>
      <p class="text-muted small">
        The very same <code>PersonCard</code> dropped into a repeater row now reads
        that row's data — each card tracks its own row with no extra wiring.
      </p>
      <FieldGroup v-model="team" v-model:errors="teamErrors">
        <RepeaterField name="people" appendLabel="Add Person">
          <div class="row g-2">
            <TextField name="name" label="Name" class="col-sm-6 mb-2" />
            <TextField name="email" label="Email" class="col-sm-6 mb-2" />
          </div>
          <PersonCard />
        </RepeaterField>
      </FieldGroup>
    </section>

    <div class="d-flex gap-2">
      <button type="button" class="btn btn-sm btn-outline-primary" @click="validate">
        Validate (populate errors)
      </button>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearErrors">
        Clear errors
      </button>
    </div>
    <p class="text-muted small mb-0">
      Validate fills the <code>errors</code> bags from a trivial check; each
      <code>PersonCard</code> reads its own slice via <code>getCurrentErrors()</code>
      and shows an issue badge.
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { FieldGroup, TextField, RepeaterField } from 'vue-fields-ms';
import type { MessageBag } from 'vue-fields-ms';
import PersonCard from '../components/PersonCard.vue';

const contact = ref({ name: 'Ada Lovelace', email: 'ada@example.com' });
const contactErrors = ref<MessageBag>({});

const team = ref({
  people: [
    { name: 'Alan Turing', email: 'alan@example.com' },
    { name: 'Grace Hopper', email: 'not-an-email' },
  ],
});
const teamErrors = ref<MessageBag>({});

// A deliberately trivial validator, just to produce error bags the cards can read.
const looksLikeEmail = (value: unknown): boolean => /.+@.+\..+/.test(String(value ?? ''));

const validate = () => {
  contactErrors.value = looksLikeEmail(contact.value.email)
    ? {}
    : { email: ['Enter a valid email address'] };

  const bag: MessageBag = {};
  team.value.people.forEach((person, i) => {
    if (!person.name) bag[`people.${i}.name`] = ['Name is required'];
    if (!looksLikeEmail(person.email)) bag[`people.${i}.email`] = ['Enter a valid email address'];
  });
  teamErrors.value = bag;
};

const clearErrors = () => {
  contactErrors.value = {};
  teamErrors.value = {};
};

// Exposed only so the demo's "Live Values" panel can display this form's data.
const vals = computed(() => ({ contact: contact.value, team: team.value }));
defineExpose({ vals });
</script>

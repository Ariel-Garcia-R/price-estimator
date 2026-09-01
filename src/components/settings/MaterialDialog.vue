<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Material, MaterialDraft } from '@/types';
import { CURRENCY_OPTIONS, DEFAULT_MATERIAL, LIMITS } from '@/utils/constants';

const props = withDefaults(
  defineProps<{ modelValue: boolean; material?: Material | null }>(),
  { material: null },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [draft: MaterialDraft];
}>();

const name = ref('');
const price = ref<number>(0);
const currency = ref<MaterialDraft['currency']>(DEFAULT_MATERIAL.currency);

// Resets on every open so a cancelled edit never leaks into the next one.
watch(
  () => [props.modelValue, props.material] as const,
  ([isOpen, material]) => {
    if (!isOpen) return;
    name.value = material?.name ?? '';
    price.value = material?.price ?? DEFAULT_MATERIAL.price;
    currency.value = material?.currency ?? DEFAULT_MATERIAL.currency;
  },
  { immediate: true },
);

const isEditing = computed(() => props.material !== null);

const isValid = computed(
  () => name.value.trim().length > 0 && Number.isFinite(price.value) && price.value > 0,
);

function close() {
  emit('update:modelValue', false);
}

function save() {
  if (!isValid.value) return;
  emit('save', { name: name.value, price: price.value, currency: currency.value });
  close();
}
</script>

<template>
  <v-dialog
    :model-value="modelValue"
    max-width="420"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title>{{ isEditing ? 'Edit material' : 'New material' }}</v-card-title>
      <v-card-text>
        <v-text-field
          v-model="name"
          label="Name"
          :maxlength="LIMITS.MATERIAL_NAME_MAX_LENGTH"
          autofocus
        />
        <v-text-field
          v-model.number="price"
          type="number"
          min="0"
          label="Price per kilo"
          suffix="/ kg"
        />
        <v-select
          v-model="currency"
          :items="CURRENCY_OPTIONS"
          label="Currency"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn @click="close">
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="!isValid"
          @click="save"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

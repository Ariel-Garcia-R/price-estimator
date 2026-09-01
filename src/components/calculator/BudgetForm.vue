<script setup lang="ts">
import { computed } from 'vue';
import { useBudgetStore } from '@/stores/budget';
import { useMaterialsStore } from '@/stores/materials';
import { SAFETY_PERCENT_OPTIONS } from '@/utils/constants';
import { formatMoney } from '@/utils/currency';

const budgetStore = useBudgetStore();
const materialsStore = useMaterialsStore();

const materialOptions = computed(() =>
  materialsStore.materials.map((material) => ({
    value: material.id,
    title: material.name,
    subtitle: `${formatMoney(material.price, material.currency)} / kg`,
  })),
);

const safetyOptions = computed(() =>
  SAFETY_PERCENT_OPTIONS.map((percent) => ({ value: percent, title: `${percent}%` })),
);
</script>

<template>
  <v-card>
    <v-card-title>Piece</v-card-title>
    <v-card-text>
      <v-text-field
        v-model.number="budgetStore.modelWeightGrams"
        type="number"
        min="0"
        label="Weight of the piece"
        suffix="g"
        autofocus
      />

      <v-select
        v-model="budgetStore.selectedMaterialId"
        :items="materialOptions"
        label="Filament"
        :disabled="!materialsStore.hasMaterials"
        :hint="materialsStore.hasMaterials ? undefined : 'Add a material in Settings'"
        :persistent-hint="!materialsStore.hasMaterials"
      >
        <template #item="{ props: itemProps, item }">
          <v-list-item
            v-bind="itemProps"
            :subtitle="item.raw.subtitle"
          />
        </template>
      </v-select>

      <v-select
        v-model="budgetStore.safetyPercent"
        :items="safetyOptions"
        label="Safety margin"
        hint="Added on top of the total to cover failed prints"
        persistent-hint
      />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Material, MaterialDraft } from '@/types';
import MaterialDialog from '@/components/settings/MaterialDialog.vue';
import { useMaterialsStore } from '@/stores/materials';
import { formatMoney } from '@/utils/currency';

const materialsStore = useMaterialsStore();

const isDialogOpen = ref(false);
const editing = ref<Material | null>(null);

function openCreate() {
  editing.value = null;
  isDialogOpen.value = true;
}

function openEdit(material: Material) {
  editing.value = material;
  isDialogOpen.value = true;
}

function handleSave(draft: MaterialDraft) {
  const current = editing.value;
  if (current) {
    materialsStore.updateMaterial(current.id, draft);
    return;
  }
  materialsStore.addMaterial(draft);
}
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <span>Materials</span>
      <v-spacer />
      <v-btn
        icon="mdi-plus"
        variant="text"
        density="comfortable"
        aria-label="Add material"
        @click="openCreate"
      />
    </v-card-title>
    <v-card-text>
      <v-list
        v-if="materialsStore.hasMaterials"
        density="compact"
      >
        <v-list-item
          v-for="material in materialsStore.materials"
          :key="material.id"
          :title="material.name"
          :subtitle="`${formatMoney(material.price, material.currency)} / kg`"
        >
          <template #append>
            <v-btn
              icon="mdi-pencil-outline"
              variant="text"
              density="comfortable"
              :aria-label="`Edit ${material.name}`"
              @click="openEdit(material)"
            />
            <v-btn
              icon="mdi-delete-outline"
              variant="text"
              density="comfortable"
              :aria-label="`Delete ${material.name}`"
              @click="materialsStore.removeMaterial(material.id)"
            />
          </template>
        </v-list-item>
      </v-list>
      <v-alert
        v-else
        type="info"
        variant="tonal"
      >
        No materials yet. Add one to use the calculator.
      </v-alert>
    </v-card-text>

    <MaterialDialog
      v-model="isDialogOpen"
      :material="editing"
      @save="handleSave"
    />
  </v-card>
</template>

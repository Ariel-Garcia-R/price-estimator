<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRatesStore } from '@/stores/rates';
import { CURRENCY } from '@/utils/constants';

const ratesStore = useRatesStore();

const manualRate = ref<string>(
  ratesStore.dollarRateCUP > 0 ? String(ratesStore.dollarRateCUP) : '',
);

const isManualRateValid = computed(() => Number(manualRate.value) > 0);

const formattedUpdatedAt = computed(() => {
  if (!ratesStore.updatedAt) return null;
  return new Date(ratesStore.updatedAt).toLocaleString('en');
});

const sourceLabel = computed(() =>
  ratesStore.source === 'eltoque' ? 'El Toque' : 'Manual',
);

function saveManualRate() {
  const value = Number(manualRate.value);
  if (!Number.isFinite(value) || value <= 0) return;
  ratesStore.setManualRate(value);
}

async function fetchFromElToque() {
  const ok = await ratesStore.refreshFromElToque();
  if (ok) {
    manualRate.value = String(ratesStore.dollarRateCUP);
  }
}
</script>

<template>
  <v-row class="mt-2">
    <v-col
      cols="12"
      sm="6"
    >
      <v-card>
        <v-card-title>Dollar price (manual)</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="manualRate"
            type="number"
            min="0"
            label="Dollar price in CUP"
            prefix="CUP"
          />
          <v-btn
            color="primary"
            block
            :disabled="!isManualRateValid"
            @click="saveManualRate"
          >
            Save manual price
          </v-btn>
        </v-card-text>
      </v-card>
    </v-col>

    <v-col
      cols="12"
      sm="6"
    >
      <v-card>
        <v-card-title>Update from El Toque</v-card-title>
        <v-card-text>
          <v-btn
            color="secondary"
            block
            :loading="ratesStore.isLoadingRate"
            :disabled="ratesStore.isLoadingRate"
            @click="fetchFromElToque"
          >
            Fetch rate from El Toque
          </v-btn>

          <v-alert
            v-if="ratesStore.rateError"
            type="error"
            variant="tonal"
            class="mt-4"
          >
            {{ ratesStore.rateError }}
          </v-alert>

          <v-card
            v-if="ratesStore.dollarRateCUP > 0"
            class="mt-4"
            variant="tonal"
          >
            <v-card-text>
              <div class="text-h6">
                {{ ratesStore.dollarRateCUP }} {{ CURRENCY.CUP }}
              </div>
              <div
                v-if="formattedUpdatedAt"
                class="text-caption"
              >
                Updated: {{ formattedUpdatedAt }}
              </div>
              <div class="text-caption">
                Source: {{ sourceLabel }}
              </div>
            </v-card-text>
          </v-card>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

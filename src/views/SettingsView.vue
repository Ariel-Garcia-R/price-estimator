<script setup lang="ts">
import DollarRateCard from '@/components/settings/DollarRateCard.vue';
import MaterialsCard from '@/components/settings/MaterialsCard.vue';
import ProductionCostCard from '@/components/settings/ProductionCostCard.vue';
</script>

<template>
  <div class="d-flex flex-column ga-4 mt-4">
    <MaterialsCard />
    <ProductionCostCard />
    <DollarRateCard />
  </div>
</template>

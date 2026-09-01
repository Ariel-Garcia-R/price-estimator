<script setup lang="ts">
import BudgetForm from '@/components/calculator/BudgetForm.vue';
import BudgetResult from '@/components/calculator/BudgetResult.vue';
import SettingsSummary from '@/components/calculator/SettingsSummary.vue';
</script>

<template>
  <div class="d-flex flex-column ga-4 mt-4">
    <BudgetForm />
    <BudgetResult />
    <SettingsSummary />
  </div>
</template>

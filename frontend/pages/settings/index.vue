<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h5 mb-4">Settings</h1>
        <p class="text-body-2 text-medium-emphasis">Settings will be implemented in a later milestone.</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
</script>

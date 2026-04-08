<template>
  <v-container>
    <v-row>
      <v-col>
        <h1 class="text-h5 mb-4">My Games</h1>
        <p class="text-body-2 text-medium-emphasis">Game list will be implemented in Milestone 7.</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
definePageMeta({ middleware: ["auth"] });
</script>

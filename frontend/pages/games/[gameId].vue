<template>
  <GoGameLayout :game-id="gameId" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import GoGameLayout from "~/components/go/GoGameLayout.vue";

const route = useRoute();
const gameId = computed(() => route.params.gameId as string);
</script>

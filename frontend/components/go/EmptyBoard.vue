<template>
  <div class="empty-board-container">
    <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet" class="empty-board">
      <GoGrid :size="size" />
    </svg>
    <div class="overlay" v-if="!loading">
      <v-btn color="primary" size="large" @click="$emit('start', size, 6.5)">
        New Game
      </v-btn>
    </div>
    <div class="overlay" v-else>
      <v-progress-circular indeterminate color="primary" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { SCALE } from "~/constants/board";
import type { GoBoardSizeType } from "~/types/goTypes";
import GoGrid from "./GoGrid.vue";

const props = withDefaults(defineProps<{
  size?: GoBoardSizeType;
  loading?: boolean;
}>(), { size: 19, loading: false });

defineEmits<{ (e: "start", size: GoBoardSizeType, komi: number): void }>();

const viewBox = computed(() => `0 0 ${props.size * SCALE} ${props.size * SCALE}`);
</script>

<style scoped>
.empty-board-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.empty-board { width: auto; height: 80vh; opacity: 0.3; }
.overlay {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

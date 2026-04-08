<template>
  <ClientOnly>
    <div class="game-container" :class="{ 'mobile-layout': isMobile }">
      <div v-if="isMobile" class="pa-2">
        <GoRootAnalysis />
      </div>
      <div class="board-section">
        <EmptyBoard v-if="!gameId" :loading="loading" @start="$emit('start', $event)" :size="boardSize" />
        <GoBoard v-else :game-id="gameId" />
        <GoNavigation v-if="isMobile" />
      </div>
      <div class="sidebar" :class="{ 'mobile-sidebar': isMobile }">
        <div class="sidebar-content">
          <GoGameHeader v-if="!isMobile" />
          <GoRootAnalysis v-if="!isMobile" />
          <GoAnalysis />
          <GoChart />
          <GoNavigation v-if="!isMobile" />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { UUID } from "crypto";
import type { GoBoardSizeType } from "~/types/goTypes";
import GoBoard from "./GoBoard.vue";
import GoGameHeader from "./GoGameHeader.vue";
import GoRootAnalysis from "./GoRootAnalysis.vue";
import GoAnalysis from "./GoAnalysis.vue";
import GoChart from "./GoChart.vue";
import GoNavigation from "./GoNavigation.vue";
import EmptyBoard from "./EmptyBoard.vue";

withDefaults(defineProps<{
  gameId: UUID | null;
  boardSize?: GoBoardSizeType;
  loading?: boolean;
}>(), { boardSize: 19, loading: false });

defineEmits<{ (e: "start", size: GoBoardSizeType, komi: number): void }>();

const isMobile = ref(false);
const check = () => { isMobile.value = window.innerWidth < 768; };
onMounted(() => { check(); window.addEventListener("resize", check); });
onUnmounted(() => window.removeEventListener("resize", check));
</script>

<style scoped>
.game-container { display: flex; gap: 20px; overflow-x: auto; }
.game-container.mobile-layout { flex-direction: column; gap: 0; }
.board-section { margin-left: 10px; flex-shrink: 0; }
.sidebar {
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  height: 100vh;
}
.mobile-sidebar { height: auto; width: 100%; padding: 0 10px; }
.sidebar-content {
  overflow-y: auto; gap: 8px;
  display: flex; flex-direction: column;
  width: 100%; max-width: 600px;
}

@media (max-width: 768px) {
  .board-section { margin-left: 0; width: 100%; padding: 0 10px; }
  .sidebar-content { padding: 8px; gap: 4px; }
}
</style>

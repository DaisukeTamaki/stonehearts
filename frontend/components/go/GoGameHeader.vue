<template>
  <v-sheet class="mb-2" elevation="0">
    <div class="game-info">
      <div class="player-info">
        <svg height="18" width="18"><circle cx="9" cy="9" r="7" fill="black" /></svg>
        <span class="player-name">{{ playerBlack || "Black" }}</span>
        <span class="capture-count">Captures: {{ blackCaptures }}</span>
      </div>
      <div class="komi-info">
        <span>Komi {{ komi }}</span>
      </div>
      <div class="player-info">
        <svg height="18" width="18"><circle cx="9" cy="9" r="7" fill="white" stroke="black" stroke-width="1" /></svg>
        <span class="player-name">{{ playerWhite || "White" }}</span>
        <span class="capture-count">Captures: {{ whiteCaptures }}</span>
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";

const gameStore = useGameStore();
const {
  getPlayerBlack, getPlayerWhite, getKomi,
  getCurrentBlackCaptureCount, getCurrentWhiteCaptureCount,
} = storeToRefs(gameStore);

const playerBlack = computed(() => getPlayerBlack.value);
const playerWhite = computed(() => getPlayerWhite.value);
const komi = computed(() => getKomi.value);
const blackCaptures = computed(() => getCurrentBlackCaptureCount.value);
const whiteCaptures = computed(() => getCurrentWhiteCaptureCount.value);
</script>

<style scoped>
.game-info { width: 100%; }
.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 2px;
}
.player-name { font-weight: bold; flex: 1; }
.capture-count { font-size: 0.85rem; color: #666; }
.komi-info {
  display: flex;
  justify-content: center;
  padding: 2px;
  background: #e0e0e0;
  border-radius: 4px;
  margin: 2px 0;
  font-size: 0.85rem;
}
</style>

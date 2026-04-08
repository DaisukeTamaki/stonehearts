<template>
  <v-sheet v-if="analysis" class="pa-2" elevation="0">
    <div class="d-flex justify-space-between align-center">
      <div class="text-body-2">
        <strong>Move {{ currentMoveIndex }}</strong>
        <span class="ml-2">{{ currentPlayer === "B" ? "Black" : "White" }} to play</span>
      </div>
      <div class="text-body-2">
        <span>B Win: {{ winrateDisplay }}</span>
        <span class="ml-3">Score: {{ scoreDisplay }}</span>
        <span class="ml-3 text-grey">{{ visits }} visits</span>
      </div>
    </div>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";
import { helperService } from "~/services/helperService";

const gameStore = useGameStore();
const { getCurrentAnalysis, getCurrentMoveIndex } = storeToRefs(gameStore);

const analysis = computed(() => getCurrentAnalysis.value);
const currentMoveIndex = computed(() => getCurrentMoveIndex.value);
const currentPlayer = computed(() => analysis.value?.rootInfo.currentPlayer ?? "B");
const winrateDisplay = computed(() => analysis.value ? helperService.formatWinrate(analysis.value.rootInfo.winrate) : "-");
const scoreDisplay = computed(() => analysis.value ? helperService.formatScoreLead(analysis.value.rootInfo.scoreLead) : "-");
const visits = computed(() => analysis.value?.rootInfo.visits ?? 0);
</script>

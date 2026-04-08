<template>
  <v-sheet v-if="candidates.length > 0" class="pa-2" elevation="0">
    <div class="text-subtitle-2 mb-1">Top Moves</div>
    <v-table density="compact">
      <thead>
        <tr>
          <th>#</th>
          <th>Move</th>
          <th>Win %</th>
          <th>Score</th>
          <th>Visits</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="info in candidates" :key="info.move">
          <td>{{ info.order + 1 }}</td>
          <td class="font-weight-medium">{{ info.move }}</td>
          <td>{{ (info.winrate * 100).toFixed(1) }}%</td>
          <td>{{ info.scoreLead >= 0 ? '+' : '' }}{{ info.scoreLead.toFixed(1) }}</td>
          <td>{{ info.visits }}</td>
          <td>
            <v-btn
              size="x-small" variant="text" icon
              @click="gameStore.enterPvMode(info.order)"
            >
              <v-icon size="small">mdi-eye</v-icon>
            </v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";

const gameStore = useGameStore();
const { getCurrentAnalysis } = storeToRefs(gameStore);

const candidates = computed(() => getCurrentAnalysis.value?.moveInfos.slice(0, 5) ?? []);
</script>

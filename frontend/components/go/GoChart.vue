<template>
  <v-sheet class="pa-2" elevation="0" v-if="series.length > 1">
    <div class="text-subtitle-2 mb-1">Win Rate</div>
    <apexchart
      type="line"
      height="180"
      :options="chartOptions"
      :series="chartSeries"
      @markerClick="onMarkerClick"
    />
  </v-sheet>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";

const gameStore = useGameStore();
const { getBlackWinRateSeries, getCurrentMoveIndex } = storeToRefs(gameStore);

const series = computed(() => getBlackWinRateSeries.value);

const chartSeries = computed(() => [{
  name: "Black Win %",
  data: series.value,
}]);

const chartOptions = computed(() => ({
  chart: {
    id: "winrate",
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
  },
  stroke: { width: 2, curve: "smooth" as const },
  colors: ["#333"],
  xaxis: {
    labels: { show: false },
  },
  yaxis: {
    min: 0, max: 100,
    labels: { formatter: (v: number) => `${v}%` },
  },
  annotations: {
    yaxis: [{ y: 50, borderColor: "#999", strokeDashArray: 4 }],
    xaxis: [{
      x: getCurrentMoveIndex.value,
      borderColor: "#2196f3",
      strokeDashArray: 0,
    }],
  },
  tooltip: {
    y: { formatter: (v: number) => `${v}%` },
  },
  grid: { padding: { left: 10, right: 10 } },
}));

const onMarkerClick = (_e: unknown, _c: unknown, config: { dataPointIndex: number }) => {
  gameStore.navigateToMove(config.dataPointIndex);
};
</script>

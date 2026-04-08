<template>
  <g :transform="`translate(${ptCoord(x)}, ${ptCoord(y)})`">
    <circle :r="stoneSize" :class="stoneClass" cx="0" cy="0" />
    <circle
      v-if="!showTurnNumber && isLastMove"
      :r="stoneSize * 0.6" cx="0" cy="0"
      :stroke="overlayColor" fill="none" stroke-width="0.3"
    />
    <text
      v-if="showTurnNumber && turnNumber != null"
      x="0" y="0" :fill="textColor"
      text-anchor="middle" dominant-baseline="central"
      :font-size="stoneSize"
    >{{ turnNumber }}</text>
  </g>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { SCALE } from "~/constants/board";
import { Color } from "~/types/apiGameTypes";

const props = withDefaults(defineProps<{
  x: number;
  y: number;
  color: string;
  turnNumber?: number | null;
  showTurnNumber?: boolean;
  isLastMove?: boolean;
}>(), {
  turnNumber: null,
  showTurnNumber: false,
  isLastMove: false,
});

const stoneSize = computed(() => SCALE / 2);
const textColor = computed(() => props.color === Color.Black ? "white" : "black");
const overlayColor = computed(() => props.color === Color.Black ? "white" : "black");
const stoneClass = computed(() => ({
  "black-stone": props.color === Color.Black,
  "white-stone": props.color === Color.White,
}));

const ptCoord = (p: number) => p * SCALE + SCALE / 2;
</script>

<style scoped>
.black-stone { fill: black; stroke: black; stroke-width: 0.4; }
.white-stone { fill: white; stroke: black; stroke-width: 0.4; }
</style>

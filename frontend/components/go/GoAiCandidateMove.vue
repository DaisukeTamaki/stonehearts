<template>
  <g :transform="`translate(${ptCoord(x)}, ${ptCoord(y)})`">
    <circle :r="radius" cx="0" cy="0" :fill="fillColor" :fill-opacity="0.7" />
    <text
      x="0" y="0" fill="white" text-anchor="middle"
      dominant-baseline="central" :font-size="fontSize" font-weight="bold"
    >{{ rank + 1 }}</text>
  </g>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { SCALE } from "~/constants/board";

const props = defineProps<{ x: number; y: number; rank: number }>();

const radius = computed(() => SCALE / 2 - 0.5);
const fontSize = computed(() => SCALE * 0.4);
const fillColor = computed(() => {
  if (props.rank === 0) return "#2196f3";
  if (props.rank === 1) return "#4caf50";
  return "#ff9800";
});

const ptCoord = (p: number) => p * SCALE + SCALE / 2;
</script>

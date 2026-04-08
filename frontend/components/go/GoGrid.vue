<template>
  <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg">
    <line
      v-for="y in size" :key="'h' + y"
      :y1="ptCoord(y - 1)" :y2="ptCoord(y - 1)"
      :x1="ptCoord(0)" :x2="ptCoord(size - 1)"
      stroke="black" stroke-width="0.5"
    />
    <line
      v-for="x in size" :key="'v' + x"
      :x1="ptCoord(x - 1)" :x2="ptCoord(x - 1)"
      :y1="ptCoord(0)" :y2="ptCoord(size - 1)"
      stroke="black" stroke-width="0.5"
    />
    <circle
      v-for="dot in guides" :key="'d' + dot.x + dot.y"
      :cx="ptCoord(dot.x)" :cy="ptCoord(dot.y)" r="1.5"
    />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { SCALE } from "~/constants/board";
import type { GoBoardSizeType, GoCoordinateType } from "~/types/goTypes";

const props = defineProps<{ size: GoBoardSizeType }>();

const viewBox = computed(() => `0 0 ${props.size * SCALE} ${props.size * SCALE}`);

const GUIDE_DOTS: Record<GoBoardSizeType, GoCoordinateType[]> = {
  19: [
    { x: 3, y: 3 }, { x: 9, y: 3 }, { x: 15, y: 3 },
    { x: 3, y: 9 }, { x: 9, y: 9 }, { x: 15, y: 9 },
    { x: 3, y: 15 }, { x: 9, y: 15 }, { x: 15, y: 15 },
  ],
  13: [
    { x: 3, y: 3 }, { x: 9, y: 3 },
    { x: 3, y: 9 }, { x: 9, y: 9 },
    { x: 6, y: 6 },
  ],
  9: [
    { x: 2, y: 2 }, { x: 6, y: 2 },
    { x: 2, y: 6 }, { x: 6, y: 6 },
    { x: 4, y: 4 },
  ],
};

const guides = computed(() => GUIDE_DOTS[props.size]);
const ptCoord = (p: number) => p * SCALE + SCALE / 2;
</script>

<template>
  <svg :viewBox="viewBox" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet"
    style="width: 100%; height: auto;">
    <GoGrid :size="size" />
    <GoStone v-for="(s, i) in stones" :key="i" :x="s.x" :y="s.y" :color="s.color" />
  </svg>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { SCALE } from "~/constants/board";
import type { GoBoardSizeType } from "~/types/goTypes";
import type { GameStone } from "~/types/apiGameTypes";
import GoGrid from "./GoGrid.vue";
import GoStone from "./GoStone.vue";

const props = withDefaults(defineProps<{
  size: GoBoardSizeType;
  stones: GameStone[];
}>(), { size: 19, stones: () => [] });

const viewBox = computed(() => `0 0 ${props.size * SCALE} ${props.size * SCALE}`);
</script>

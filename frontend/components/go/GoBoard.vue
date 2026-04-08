<template>
  <div class="go-board-container">
    <svg
      ref="boardRef"
      xmlns="http://www.w3.org/2000/svg"
      :viewBox="viewBox"
      preserveAspectRatio="xMidYMin meet"
      :class="{ 'single-board': !isInCard, 'card-board': isInCard }"
      @pointermove="onPointerMove"
      @mouseleave="onMouseLeave"
      @pointerdown="onPointerDown"
      @click="onClick"
    >
      <GoGrid :size="boardSize" />
      <GoStone
        v-for="stone in displayedStones" :key="`${stone.x}-${stone.y}`"
        :x="stone.x" :y="stone.y" :color="stone.color"
        :turnNumber="stone.turnNumber"
        :showTurnNumber="showTurnNumbers"
        :isLastMove="stone.isLastMove"
      />
      <GoStone
        v-if="hoverStone && hoverVisible"
        class="hover-stone"
        :x="hoverStone.x" :y="hoverStone.y" :color="currentPlayer"
      />
      <template v-if="showCandidates">
        <GoAiCandidateMove
          v-for="move in candidateMoves" :key="`ai-${move.x}-${move.y}`"
          :x="move.x" :y="move.y" :rank="move.rank"
        />
      </template>
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, onMounted } from "vue";
import { storeToRefs } from "pinia";
import { SCALE } from "~/constants/board";
import { useGameStore } from "~/stores/game";
import type { GoCoordinateType, GoStoneType } from "~/types/goTypes";
import GoGrid from "./GoGrid.vue";
import GoStone from "./GoStone.vue";
import GoAiCandidateMove from "./GoAiCandidateMove.vue";
import type { UUID } from "crypto";

const props = withDefaults(defineProps<{
  gameId: UUID;
  isInCard?: boolean;
}>(), { isInCard: false });

const gameStore = useGameStore();
const { getBoardSize, getCurrentCandidateMoves, getCurrentStones, getCurrentPlayer, isPvMode } = storeToRefs(gameStore);

const boardSize = computed(() => getBoardSize.value);
const candidateMoves = computed(() => getCurrentCandidateMoves.value.slice(0, 3));
const stones = computed(() => getCurrentStones.value);
const currentPlayer = computed(() => getCurrentPlayer.value);

const viewBox = computed(() => `0 0 ${boardSize.value * SCALE} ${boardSize.value * SCALE}`);
const boardRef = ref<SVGSVGElement | null>(null);
const displayedStones = ref<GoStoneType[]>(stones.value);
const hoverStone = ref<GoStoneType | null>(null);
const hoverVisible = ref(true);
const isShowingPv = ref(false);

const showCandidates = computed(() => !isPvMode.value && !isShowingPv.value);
const showTurnNumbers = computed(() => isPvMode.value || isShowingPv.value);

const fetchGame = async () => { await gameStore.loadGame(props.gameId); };
onMounted(fetchGame);
watch(() => props.gameId, fetchGame);
watch(stones, (s) => { displayedStones.value = s; });

const eventToPoint = (e: PointerEvent): GoCoordinateType | null => {
  if (!boardRef.value) return null;
  const pt = boardRef.value.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const ctm = boardRef.value.getScreenCTM();
  if (!ctm) return null;
  const t = pt.matrixTransform(ctm.inverse());
  const x = Math.floor(t.x / SCALE), y = Math.floor(t.y / SCALE);
  return x >= 0 && x < boardSize.value && y >= 0 && y < boardSize.value ? { x, y } : null;
};

const clearHover = () => { hoverStone.value = null; };

const onPointerMove = (e: PointerEvent) => {
  if (props.isInCard || !boardRef.value || isPvMode.value || e.pointerType !== "mouse") return;
  const pos = eventToPoint(e);
  if (!pos) { clearHover(); return; }
  const candidate = candidateMoves.value.find((m) => m.x === pos.x && m.y === pos.y);
  if (candidate) {
    const pvStones = gameStore.getPrincipalVariationStones(candidate.rank);
    if (pvStones.length) {
      hoverVisible.value = false;
      isShowingPv.value = true;
      displayedStones.value = pvStones[pvStones.length - 1];
      return;
    }
  }
  isShowingPv.value = false;
  displayedStones.value = stones.value;
  const occupied = stones.value.some((s) => s.x === pos.x && s.y === pos.y);
  if (occupied) { clearHover(); return; }
  hoverVisible.value = true;
  hoverStone.value = { x: pos.x, y: pos.y, color: currentPlayer.value };
};

const onMouseLeave = () => {
  clearHover();
  isShowingPv.value = false;
  displayedStones.value = stones.value;
};

const onPointerDown = async (e: PointerEvent) => {
  if (props.isInCard || !boardRef.value || isPvMode.value || e.pointerType !== "touch") return;
  const pos = eventToPoint(e);
  if (!pos) return;
  if (!stones.value.some((s) => s.x === pos.x && s.y === pos.y)) {
    await gameStore.makeMove(pos);
  }
};

const onClick = async () => {
  if (props.isInCard) return;
  if (isPvMode.value) { gameStore.exitPvMode(); return; }
  if (!hoverStone.value) return;
  const coord = { x: hoverStone.value.x, y: hoverStone.value.y };
  hoverStone.value = null;
  hoverVisible.value = false;
  await gameStore.makeMove(coord);
};
</script>

<style scoped>
.go-board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  flex-shrink: 0;
}
svg { overflow: visible; }
.single-board {
  width: auto;
  height: 90vh;
  overflow: visible;
  margin: auto;
  min-width: min-content;
}
.card-board {
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  margin: auto;
}
.hover-stone { fill-opacity: 0.75; }

@media (max-width: 768px) {
  .go-board-container { height: auto; }
  .single-board { width: 100%; height: auto; max-height: 90vh; }
}
</style>

<template>
  <div>
    <v-row v-if="loaded && games.length > 0" dense>
      <v-col v-for="game in games" :key="game.game_id" cols="6" sm="6" md="4" lg="3">
        <v-card class="ma-1" variant="outlined">
          <NuxtLink :to="`/games/${game.game_id}`" class="d-block">
            <v-card-text class="pa-1">
              <GoStaticBoard :size="game.board_size" :stones="game.occupied_points" />
            </v-card-text>
          </NuxtLink>
          <v-card-text class="d-flex align-center pa-2 pt-0">
            <NuxtLink :to="`/games/${game.game_id}`" class="flex-grow-1 text-decoration-none" style="color: inherit; min-width: 0;">
              <div class="d-flex align-center mb-1">
                <svg height="14" width="14" class="mr-1"><circle cx="7" cy="7" r="6" fill="black" /></svg>
                <span class="text-truncate text-body-2">{{ game.player_black || "Black" }}</span>
              </div>
              <div class="d-flex align-center">
                <svg height="14" width="14" class="mr-1"><circle cx="7" cy="7" r="6" fill="white" stroke="black" stroke-width="1" /></svg>
                <span class="text-truncate text-body-2">{{ game.player_white || "White" }}</span>
              </div>
            </NuxtLink>
            <v-menu>
              <template #activator="{ props }">
                <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" />
              </template>
              <v-list density="compact">
                <v-list-item @click="editGame(game.game_id)">
                  <template #prepend><v-icon size="small">mdi-pencil</v-icon></template>
                  <v-list-item-title>Edit info</v-list-item-title>
                </v-list-item>
                <v-list-item @click="pendingDelete = game.game_id; deleteDialog = true">
                  <template #prepend><v-icon size="small">mdi-delete</v-icon></template>
                  <v-list-item-title>Delete</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-if="loaded && games.length === 0" class="text-center pa-8">
      <p class="text-body-1 mb-4">No games yet.</p>
      <v-btn color="primary" @click="$emit('create-game')">Create New Game</v-btn>
    </div>

    <div v-if="!loaded" class="d-flex justify-center pa-8">
      <v-progress-circular indeterminate color="primary" />
    </div>

    <GoGameDetail ref="detailRef" mode="list" :game-id="selectedGameId" />

    <v-dialog v-model="deleteDialog" max-width="350">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>Delete this game permanently?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="deleteDialog = false" />
          <v-btn text="Delete" color="error" @click="confirmDelete" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import type { UUID } from "crypto";
import { useGameListStore } from "~/stores/gameListStore";
import type { BoardPosition } from "~/types/apiGameTypes";
import GoStaticBoard from "./GoStaticBoard.vue";
import GoGameDetail from "./GoGameDetail.vue";

const props = withDefaults(defineProps<{ isDraft?: boolean }>(), { isDraft: undefined });
defineEmits<{ (e: "create-game"): void }>();

const gameListStore = useGameListStore();
const loaded = ref(false);
const deleteDialog = ref(false);
const pendingDelete = ref<UUID | null>(null);
const selectedGameId = ref<UUID | null>(null);
const detailRef = ref<InstanceType<typeof GoGameDetail> | null>(null);
const skip = ref(0);
const limit = ref(24);

const games = computed<BoardPosition[]>(() => {
  return Object.values(gameListStore.games).filter((g) => {
    if (props.isDraft === undefined) return true;
    return g.is_draft === props.isDraft;
  });
});

const loadGames = async () => {
  await gameListStore.fetchGames(skip.value, limit.value, props.isDraft);
  loaded.value = true;
};

const editGame = (id: UUID) => {
  selectedGameId.value = id;
  detailRef.value?.openDialog();
};

const confirmDelete = async () => {
  if (pendingDelete.value) {
    await gameListStore.removeGame(pendingDelete.value);
    pendingDelete.value = null;
    deleteDialog.value = false;
  }
};

onMounted(loadGames);
</script>

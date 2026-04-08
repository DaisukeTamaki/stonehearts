<template>
  <v-container>
    <div class="d-flex justify-space-between align-center mb-4">
      <h1 class="text-h5">My Games</h1>
      <div class="d-flex gap-2">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="newGameDialog = true">
          New Game
        </v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-upload" @click="sgfDialog = true">
          Import SGF
        </v-btn>
      </div>
    </div>

    <v-tabs v-model="tab" class="mb-4">
      <v-tab value="draft">Draft</v-tab>
      <v-tab value="completed">Completed</v-tab>
    </v-tabs>

    <GoCardList
      :is-draft="tab === 'draft'"
      @create-game="newGameDialog = true"
    />

    <v-dialog v-model="newGameDialog" max-width="400">
      <v-card>
        <v-card-title>New Game</v-card-title>
        <v-card-text>
          <v-text-field v-model="newGame.player_black" label="Black player" density="compact" />
          <v-text-field v-model="newGame.player_white" label="White player" density="compact" />
          <v-select
            v-model="newGame.board_size" :items="[9, 13, 19]"
            label="Board size" density="compact"
          />
          <v-text-field v-model.number="newGame.komi" label="Komi" type="number" density="compact" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="newGameDialog = false" />
          <v-btn text="Create" color="primary" :loading="creating" @click="createGame" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="sgfDialog" max-width="500">
      <v-card>
        <v-card-title>Import SGF</v-card-title>
        <v-card-text>
          <v-textarea v-model="sgfContent" label="Paste SGF content" rows="8" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="sgfDialog = false" />
          <v-btn text="Import" color="primary" :loading="importing" @click="importSgf" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { navigateTo } from "#app";
import GoCardList from "~/components/go/GoCardList.vue";
import * as gameService from "~/services/gameService";
import type { GameMetaCreate } from "~/types/apiGameTypes";
import { DEFAULT_BOARD_SIZE, DEFAULT_KOMI } from "~/types/apiGameTypes";

definePageMeta({ middleware: "auth" });

const tab = ref("draft");
const newGameDialog = ref(false);
const sgfDialog = ref(false);
const creating = ref(false);
const importing = ref(false);
const sgfContent = ref("");

const newGame = reactive<GameMetaCreate>({
  player_black: "", player_white: "",
  board_size: DEFAULT_BOARD_SIZE, komi: DEFAULT_KOMI,
  is_draft: true,
});

const createGame = async () => {
  creating.value = true;
  try {
    const game = await gameService.createGame(newGame);
    newGameDialog.value = false;
    navigateTo(`/games/${game.game_id}`);
  } catch (e) {
    console.error("Failed to create game:", e);
  } finally {
    creating.value = false;
  }
};

const importSgf = async () => {
  if (!sgfContent.value.trim()) return;
  importing.value = true;
  try {
    const game = await gameService.createGameFromSgf(sgfContent.value);
    sgfDialog.value = false;
    sgfContent.value = "";
    navigateTo(`/games/${game.game_id}`);
  } catch (e) {
    console.error("Failed to import SGF:", e);
  } finally {
    importing.value = false;
  }
};
</script>

<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>Game Details</v-card-title>
      <v-card-text>
        <v-text-field v-model="form.game_name" label="Game name" density="compact" />
        <v-text-field v-model="form.player_black" label="Black player" density="compact" />
        <v-text-field v-model="form.player_white" label="White player" density="compact" />
        <v-text-field v-model.number="form.komi" label="Komi" type="number" density="compact" />
        <v-text-field v-model="form.game_date" label="Date (YYYY-MM-DD)" density="compact" />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text="Cancel" @click="dialog = false" />
        <v-btn text="Save" color="primary" @click="save" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";
import { useGameListStore } from "~/stores/gameListStore";
import type { GameMetaUpdate } from "~/types/apiGameTypes";
import type { UUID } from "crypto";

const props = defineProps<{
  mode: "single" | "list";
  gameId: UUID | null;
}>();

const gameStore = useGameStore();
const gameListStore = useGameListStore();
const dialog = ref(false);

const form = reactive<GameMetaUpdate>({
  game_name: "", player_black: "", player_white: "", komi: 6.5, game_date: "",
});

const openDialog = () => {
  if (props.mode === "single") {
    const info = gameStore.getGameInfo;
    if (info) Object.assign(form, info);
  } else if (props.gameId) {
    const g = gameListStore.getGame(props.gameId);
    if (g) Object.assign(form, g);
  }
  dialog.value = true;
};

const save = async () => {
  if (!props.gameId) return;
  if (props.mode === "single") {
    await gameStore.updateGameMeta(props.gameId, form);
  } else {
    await gameListStore.updateGame(props.gameId, form);
  }
  dialog.value = false;
};

defineExpose({ openDialog });
</script>

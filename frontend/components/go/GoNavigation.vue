<template>
  <div class="game-navigation">
    <v-tooltip text="Restore main line" location="top">
      <template #activator="{ props }">
        <v-btn icon variant="text" density="comfortable" v-bind="props"
          :disabled="isRestoreGameDisabled" @click="gameStore.restoreGameHistoryFromBackup()">
          <v-icon>mdi-undo</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <v-tooltip text="Set as main line" location="top">
      <template #activator="{ props }">
        <v-btn icon variant="text" density="comfortable" v-bind="props"
          :disabled="isSetAsMainDisabled" @click="setAsMainDialog = true">
          <v-icon>mdi-bookmark</v-icon>
        </v-btn>
      </template>
    </v-tooltip>

    <v-dialog v-model="setAsMainDialog" max-width="400">
      <v-card>
        <v-card-title>Set as Main Line</v-card-title>
        <v-card-text>Set this variation as the main line?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="setAsMainDialog = false" />
          <v-btn text="Confirm" @click="setAsMainDialog = false; gameStore.setVariationAsMain()" />
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-btn icon variant="text" :disabled="isNavigateToStartDisabled" @click="gameStore.navigateToStart()">
      <v-icon>mdi-skip-backward</v-icon>
    </v-btn>
    <v-btn icon variant="text" :disabled="isNavigateBackward10Disabled" @click="gameStore.navigateBackward10()">
      <v-icon>mdi-rewind</v-icon>
    </v-btn>
    <v-btn icon variant="text" :disabled="isNavigateBackwardDisabled" @click="gameStore.navigateStep(-1)">
      <v-icon>mdi-chevron-left</v-icon>
    </v-btn>
    <v-btn icon variant="text" :disabled="isNavigateForwardDisabled" @click="gameStore.navigateStep(1)">
      <v-icon>mdi-chevron-right</v-icon>
    </v-btn>
    <v-btn icon variant="text" :disabled="isNavigateForward10Disabled" @click="gameStore.navigateForward10()">
      <v-icon>mdi-fast-forward</v-icon>
    </v-btn>
    <v-btn icon variant="text" :disabled="isNavigateToEndDisabled" @click="gameStore.navigateToEnd()">
      <v-icon>mdi-skip-forward</v-icon>
    </v-btn>

    <v-tooltip text="Delete move" location="top">
      <template #activator="{ props }">
        <v-btn icon variant="text" v-bind="props"
          :disabled="isDeleteMoveDisabled" @click="deleteDialog = true">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Move</v-card-title>
        <v-card-text>Delete this move and all subsequent moves?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text="Cancel" @click="deleteDialog = false" />
          <v-btn text="Delete" color="error" @click="deleteDialog = false; gameStore.deleteCurrentMove()" />
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { storeToRefs } from "pinia";
import { useGameStore } from "~/stores/game";

const gameStore = useGameStore();
const {
  isRestoreGameDisabled, isSetAsMainDisabled,
  isNavigateToStartDisabled, isNavigateBackward10Disabled,
  isNavigateBackwardDisabled, isNavigateForwardDisabled,
  isNavigateForward10Disabled, isNavigateToEndDisabled,
  isDeleteMoveDisabled,
} = storeToRefs(gameStore);

const setAsMainDialog = ref(false);
const deleteDialog = ref(false);
</script>

<style scoped>
.game-navigation {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
}
</style>

import { defineStore } from "pinia";
import { gameState } from "./state";
import { gameGetters } from "./getters";
import { gameActions } from "./actions";

export const useGameStore = defineStore("gameStore", {
  state: gameState,
  getters: gameGetters,
  actions: gameActions,
});

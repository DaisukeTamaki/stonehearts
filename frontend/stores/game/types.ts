import type { GameState } from "~/types/goTypes";
import type { Store } from "pinia";
import type { gameGetters } from "./getters";
import type { gameActions } from "./actions";

export type GameStore = Store<"gameStore", GameState, typeof gameGetters, typeof gameActions>;
export type GameStoreThis = GameStore;

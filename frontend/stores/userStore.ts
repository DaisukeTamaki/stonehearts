import { defineStore } from "pinia";
import type { UserResponse } from "@/types/apiAuthTypes";

interface UserState {
  user: UserResponse | null;
}

export const useUserStore = defineStore("user", {
  state: (): UserState => ({
    user: null,
  }),

  getters: {
    currentUser: (state) => state.user,
    userName: (state) => state.user?.name ?? state.user?.email ?? "Guest",
  },

  actions: {
    setUser(user: UserResponse) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
    },
  },

  persist: true,
});

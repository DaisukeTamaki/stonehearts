import { defineStore } from "pinia";

interface AuthState {
  token: string | null;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    token: null,
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    tokenString: (state) => state.token,
  },

  actions: {
    setToken(token: string) {
      this.token = token;
    },
    clearToken() {
      this.token = null;
    },
  },

  persist: true,
});

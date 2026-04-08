import { useAuthStore } from "@/stores/authStore";
import { defineNuxtRouteMiddleware, navigateTo } from "nuxt/app";

const protectedPaths = ["/games/game-list", "/settings"];

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();

  if (!authStore.isLoggedIn && protectedPaths.includes(to.path) && !to.query.showLogin) {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("targetPath", to.fullPath);
    }
    return navigateTo(
      { path: to.path, query: { ...to.query, showLogin: "true" } },
      { replace: true },
    );
  }
});

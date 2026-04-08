<template>
  <v-navigation-drawer app>
    <v-list density="compact" nav>
      <v-list-item prepend-icon="mdi-home" title="Home" to="/" />
      <v-list-item
        v-if="authStore.isLoggedIn"
        prepend-icon="mdi-view-list"
        title="My Games"
        to="/games/game-list"
      />
      <v-list-item
        v-if="authStore.isLoggedIn"
        prepend-icon="mdi-cog"
        title="Settings"
        to="/settings"
      />
    </v-list>

    <template #append>
      <div class="pa-2">
        <UserMenu />
      </div>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import UserMenu from "~/components/navigation/UserMenu.vue";

const authStore = useAuthStore();
</script>

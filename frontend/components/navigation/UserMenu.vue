<template>
  <div v-if="authStore.isLoggedIn">
    <v-btn block variant="outlined" color="error" @click="handleLogout">
      <v-icon start>mdi-logout</v-icon>
      Sign Out
    </v-btn>
  </div>
  <div v-else>
    <v-btn block variant="outlined" color="primary" @click="showLogin = true">
      <v-icon start>mdi-login</v-icon>
      Sign In
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "@/stores/authStore";
import { useUserStore } from "@/stores/userStore";

const authStore = useAuthStore();
const userStore = useUserStore();
const showLogin = defineModel<boolean>("showLogin", { default: false });

function handleLogout() {
  authStore.clearToken();
  userStore.clearUser();
  navigateTo("/");
}
</script>

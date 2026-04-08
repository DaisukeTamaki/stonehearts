<template>
  <v-app>
    <NavigationDrawer />
    <v-main>
      <slot />
    </v-main>
    <LoginDialog />
  </v-app>
</template>

<script setup lang="ts">
import NavigationDrawer from "~/components/navigation/NavigationDrawer.vue";
import LoginDialog from "~/components/auth/LoginDialog.vue";
</script>

<template>
  <v-dialog v-model="showDialog" max-width="400" persistent>
    <v-card class="pa-6 text-center">
      <v-card-title class="text-h6">Sign in to StoneHearts</v-card-title>
      <v-card-text>
        <GoogleLoginButton @success="onLoginSuccess" />
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn variant="text" @click="close">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import GoogleLoginButton from "~/components/auth/GoogleLoginButton.vue";

const route = useRoute();
const router = useRouter();

const showDialog = computed({
  get: () => route.query.showLogin === "true",
  set: (val: boolean) => {
    if (!val) close();
  },
});

function close() {
  const query = { ...route.query };
  delete query.showLogin;
  router.replace({ query });
}

function onLoginSuccess() {
  close();
  const target = typeof window !== "undefined" ? sessionStorage.getItem("targetPath") : null;
  if (target) {
    sessionStorage.removeItem("targetPath");
    navigateTo(target);
  }
}
</script>

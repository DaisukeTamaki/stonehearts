<template>
  <div class="d-flex justify-center">
    <GoogleLogin :callback="handleCredentialResponse" />
  </div>
</template>

<script setup lang="ts">
import { googleLogin } from "@/services/authService";
import { getUserInfo } from "@/services/authService";
import { useUserStore } from "@/stores/userStore";

const emit = defineEmits<{ success: [] }>();
const userStore = useUserStore();

async function handleCredentialResponse(response: { credential: string }) {
  try {
    await googleLogin(response.credential);
    const user = await getUserInfo();
    userStore.setUser(user);
    emit("success");
  } catch (error) {
    console.error("Login failed:", error);
  }
}
</script>

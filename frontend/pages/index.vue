<template>
  <v-container class="d-flex align-center justify-center" style="min-height: 80vh">
    <v-card max-width="600" class="text-center pa-8" elevation="4">
      <v-card-title class="text-h4 mb-4">StoneHearts</v-card-title>
      <v-card-subtitle class="text-body-1 mb-6">
        Go (Baduk / Weiqi) game management and AI analysis
      </v-card-subtitle>
      <v-card-actions class="justify-center">
        <v-btn color="primary" size="large" variant="elevated" to="/games/game-list">
          <v-icon start>mdi-view-list</v-icon>
          My Games
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

import { defineNuxtConfig } from "nuxt/config";
import vuetify, { transformAssetUrls } from "vite-plugin-vuetify";

export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-04-03",
  devtools: { enabled: true },

  plugins: [
    "@/plugins/googleLogin.client.ts",
    "@/plugins/piniaPersistedState.client.ts",
  ],

  modules: [
    "@pinia/nuxt",
    (_options, nuxt) => {
      nuxt.hooks.hook("vite:extendConfig", (config) => {
        // @ts-expect-error -- vuetify plugin type
        config.plugins.push(vuetify({ autoImport: true }));
      });
    },
  ],

  build: {
    transpile: ["vuetify"],
  },

  vite: {
    vue: {
      template: {
        transformAssetUrls,
      },
    },
  },

  runtimeConfig: {
    public: {
      apiBaseUrl: "",
      googleClientId: "",
    },
  },

  app: {
    head: {
      title: "StoneHearts",
      meta: [
        { name: "theme-color", content: "#ffffff" },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
      ],
    },
  },
});

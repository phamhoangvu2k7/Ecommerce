import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  modules: [
    "@nuxthub/core",
    "@pinia/nuxt"
  ],
  hub: {
    // Vô hiệu hóa D1, KV, Blob vì đang dùng MongoDB Atlas và Cloudinary
    database: false,
    kv: false,
    blob: false
  },
  css: ["~/assets/css/style.css"],
  devtools: { enabled: true }
});

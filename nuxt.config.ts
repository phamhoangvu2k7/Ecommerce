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
  app: {
    head: {
      title: "Product Management Premium System",
      htmlAttrs: {
        lang: "vi"
      },
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" }
      ]
    }
  },
  devtools: { enabled: true }
});

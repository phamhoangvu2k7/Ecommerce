import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: [
    '@nuxthub/core',
    '@pinia/nuxt',
  ],

  $development: {
    hub: {
      db: 'sqlite',
      kv: true,
      blob: true,
    },
  },
  $production: {
    nitro: {
      preset: 'cloudflare-pages',
    },
    hub: {
      db: {
        dialect: 'sqlite',
        driver: 'd1',
        connection: { databaseId: 'b3b4d860-8100-46bc-bdec-a6127c4a7fc9' },
      },
      kv: {
        driver: 'cloudflare-kv-binding',
        namespaceId: '517b13cf22994084a68a702c85bcfcb5',
      },
      blob: true,
    },
  },
  experimental: {
    payloadExtraction: false,
  },
  css: ['~/assets/css/style.css'],
  app: {
    head: {
      title: 'Product Management Premium System',
      htmlAttrs: {
        lang: 'vi',
      },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: 'anonymous' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap' },
      ],
    },
  },
  devtools: { enabled: true },
})

import { defineNuxtPlugin, reloadNuxtApp } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:chunkError', ({ error }) => {
    console.warn('Phát hiện lỗi tải file module (chunk error), đang tự động tải lại ứng dụng...', error)
    reloadNuxtApp({ ttl: 1000, force: true })
  })
})

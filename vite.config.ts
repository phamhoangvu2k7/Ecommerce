import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    vue(),
    nitro()
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "~": fileURLToPath(new URL("./", import.meta.url))
    }
  }
});

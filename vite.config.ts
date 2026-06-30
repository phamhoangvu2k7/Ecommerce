import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { nitro } from "nitro/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  // Load environment variables from .env file into process.env for local development
  const env = loadEnv(mode, process.cwd(), "");
  Object.assign(process.env, env);

  return {
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
  };
});

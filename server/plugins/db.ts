import { definePlugin } from "nitro";
import mongoose from "mongoose";
import dns from "node:dns";

// Force public DNS to resolve MongoDB Atlas SRV records correctly on local machines (only in local development)
if (process.env.NODE_ENV !== "production") {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
  } catch (e) {
    console.warn("[DNS] Failed to configure custom DNS servers:", e);
  }
}


export default definePlugin((nitroApp) => {
  const uri = process.env.MONGO_URL || process.env.MONGODB_URI;
  const dbName = process.env.MONGO_NAME || "product-management";

  if (!uri) {
    console.warn("[MongoDB] WARNING: MONGO_URL environment variable is not defined. Falling back to local MongoDB at 127.0.0.1");
  }

  const connectionUri = uri || "mongodb://127.0.0.1:27017/product-management";

  console.log(`[MongoDB] Connecting to database "${dbName}"...`);

  mongoose.connect(connectionUri, { dbName })
    .then(() => {
      console.log("[MongoDB] Connection established successfully.");
    })
    .catch((err) => {
      console.error("[MongoDB] Connection error:", err);
    });

  // Handle server shutdown hook
  nitroApp.hooks.hook("close", async () => {
    console.log("[MongoDB] Disconnecting...");
    await mongoose.disconnect();
    console.log("[MongoDB] Disconnected.");
  });
});

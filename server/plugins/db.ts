import { definePlugin } from "nitro";
import mongoose from "mongoose";
import dns from "node:dns";
import { Product } from "~/server/utils/models.ts";
import { stripImageDomain } from "~/server/utils/helpers.ts";

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
    .then(async () => {
      console.log("[MongoDB] Connection established successfully.");
      await migrateLegacyThumbnails();
      await cleanAndMapDatabase();
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

async function migrateLegacyThumbnails() {
  try {
    const products = await Product.find({
      thumbnail: { $regex: /^https?:\/\// }
    });

    let migratedCount = 0;
    for (const product of products) {
      const rawThumbnail = product.get("thumbnail", null, { getters: false });
      if (rawThumbnail && (rawThumbnail.startsWith("http://") || rawThumbnail.startsWith("https://"))) {
        const relativePath = stripImageDomain(rawThumbnail);
        if (relativePath !== rawThumbnail) {
          await Product.updateOne(
            { _id: product._id },
            { $set: { thumbnail: relativePath } }
          );
          migratedCount++;
        }
      }
    }

    if (migratedCount > 0) {
      console.log(`[MongoDB Migration] Successfully migrated ${migratedCount} products to relative thumbnail paths.`);
    } else {
      console.log("[MongoDB Migration] No legacy product thumbnails need migration.");
    }
  } catch (err) {
    console.error("[MongoDB Migration] Failed to run legacy thumbnail migration:", err);
  }
}

async function cleanAndMapDatabase() {
  try {
    // 1. Delete test products created during development tests
    const delResult = await Product.deleteMany({
      title: /^(Cloudinary )?Test Product/i
    });
    if (delResult.deletedCount > 0) {
      console.log(`[MongoDB Clean] Deleted ${delResult.deletedCount} temporary test products.`);
    }

    // 2. Map existing seed products in the DB to use working Cloudinary paths
    const mapping = [
      { title: "iPhone 15 Pro Max", path: "v1782806960/products/khuvetxll0lpkkg3kzsv.webp" },
      { title: "Samsung Galaxy S24 Ultra", path: "v1782806930/products/wriwuz2mznhxgwal05nq.webp" },
      { title: "MacBook Air M3", path: "v1782807044/products/fex0j6t83fjtnk8dmlrq.webp" },
      { title: "Dell XPS 13 Plus", path: "v1782807018/products/qzurwujesh7ezjp9ku7p.webp" },
      { title: "Tai nghe Apple AirPods Pro 2", path: "v1782806859/products/mty05la5cdugoziulp3f.webp" }
    ];

    let updateCount = 0;
    for (const item of mapping) {
      const res = await Product.updateOne(
        { title: item.title },
        { $set: { thumbnail: item.path } }
      );
      if (res.modifiedCount > 0) {
        updateCount++;
      }
    }
    if (updateCount > 0) {
      console.log(`[MongoDB Clean] Successfully mapped ${updateCount} seed products to active Cloudinary paths.`);
    }
  } catch (err) {
    console.error("[MongoDB Clean] Failed to clean and map database:", err);
  }
}

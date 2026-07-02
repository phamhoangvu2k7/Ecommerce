import { defineEventHandler, createError, readMultipartFormData } from "h3";
import { uploadToCloudinary, stripImageDomain, prependImageDomain } from "../../utils/helpers.ts";

export default defineEventHandler(async (event) => {
  // Verify admin permissions (context set by global auth middleware)
  const admin = event.context.admin;
  const permissions = admin?.role_id?.permissions || [];
  if (!admin || (!permissions.includes("products_create") && !permissions.includes("products_edit"))) {
    throw createError({
      statusCode: 403,
      statusMessage: "Bạn không có quyền tải ảnh lên hệ thống."
    });
  }


  const parts = await readMultipartFormData(event);
  if (!parts || parts.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Không nhận được dữ liệu tải lên."
    });
  }

  // Find the file parameter
  const filePart = parts.find((p) => p.name === "file");
  if (!filePart || !filePart.data || filePart.data.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: "Vui lòng đính kèm một file ảnh hợp lệ."
    });
  }

  try {
    // Upload buffer to Cloudinary folder "products"
    const rawUrl = await uploadToCloudinary(filePart.data, "products");
    
    // Resolve URL using the configured image base URL
    const resolvedUrl = prependImageDomain(stripImageDomain(rawUrl));

    return {
      success: true,
      url: resolvedUrl
    };
  } catch (err: any) {
    console.error("[Cloudinary] Upload failed:", err);
    throw createError({
      statusCode: 500,
      statusMessage: "Lỗi lưu trữ ảnh lên đám mây Cloudinary."
    });
  }
});

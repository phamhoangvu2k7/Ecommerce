import { defineEventHandler, readBody, createError, parseCookies } from "h3";
import { CartService } from "../../../utils/services.ts";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { productId, quantity } = body;

  if (!productId || quantity === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: "Thiếu thông tin cập nhật sản phẩm."
    });
  }

  const cookies = parseCookies(event);
  const guestCartId = cookies.cartId;
  const user = event.context.user;

  const cart = await CartService.getOrCreateCart(guestCartId, user ? user._id.toString() : null);

  try {
    await CartService.updateCartItem(String(cart._id), productId, Number(quantity), user ? user._id.toString() : null);
    return {
      success: true,
      message: "Cập nhật giỏ hàng thành công."
    };
  } catch (err: any) {
    throw createError({
      statusCode: 400,
      statusMessage: err.message
    });
  }
});

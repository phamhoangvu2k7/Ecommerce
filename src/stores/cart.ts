import { defineStore } from "pinia";
import { ref } from "vue";

export const useCartStore = defineStore("cart", () => {
  const products = ref<any[]>([]);
  const totalAmount = ref<number>(0);
  const cartId = ref<string | null>(null);

  async function fetchCart() {
    try {
      const token = localStorage.getItem("token");
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/client/cart", { headers });
      const data = await res.json();
      if (data.success) {
        products.value = data.products;
        totalAmount.value = data.totalAmount;
        cartId.value = data.cartId;
      }
    } catch (err) {
      console.error("[CartStore] Error fetching cart:", err);
    }
  }

  async function addToCart(productId: string, quantity: number) {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/client/cart/add", {
      method: "POST",
      headers,
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.statusMessage || "Lỗi thêm giỏ hàng");
    await fetchCart();
  }

  async function updateQuantity(productId: string, quantity: number) {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/client/cart/update", {
      method: "POST",
      headers,
      body: JSON.stringify({ productId, quantity })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.statusMessage || "Lỗi cập nhật giỏ hàng");
    await fetchCart();
  }

  async function removeFromCart(productId: string) {
    const token = localStorage.getItem("token");
    const headers: any = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("/api/client/cart/delete", {
      method: "POST",
      headers,
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.statusMessage || "Lỗi xóa sản phẩm");
    await fetchCart();
  }

  function clearCart() {
    products.value = [];
    totalAmount.value = 0;
  }

  return {
    products,
    totalAmount,
    cartId,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart
  };
});

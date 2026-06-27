import { createRouter, createWebHistory } from "vue-router";

const routes = [
  // Client Pages
  {
    path: "/",
    component: () => import("./layouts/ClientLayout.vue"),
    children: [
      { path: "", component: () => import("./pages/client/Home.vue") },
      { path: "products", component: () => import("./pages/client/ProductList.vue") },
      { path: "products/:id", component: () => import("./pages/client/ProductDetail.vue") },
      { path: "cart", component: () => import("./pages/client/Cart.vue") },
      { path: "checkout", component: () => import("./pages/client/Checkout.vue"), meta: { requiresAuth: true } },
      { path: "profile", component: () => import("./pages/client/Profile.vue"), meta: { requiresAuth: true } },
      { path: "orders", component: () => import("./pages/client/Orders.vue"), meta: { requiresAuth: true } },
      { path: "login", component: () => import("./pages/client/Login.vue") },
      { path: "register", component: () => import("./pages/client/Register.vue") },
      { path: "forgot-password", component: () => import("./pages/client/ForgotPassword.vue") }
    ]
  },
  // Admin Pages
  {
    path: "/admin/login",
    component: () => import("./pages/admin/Login.vue")
  },
  {
    path: "/admin",
    component: () => import("./layouts/AdminLayout.vue"),
    meta: { requiresAdmin: true },
    children: [
      { path: "", redirect: "/admin/dashboard" },
      { path: "dashboard", component: () => import("./pages/admin/Dashboard.vue") },
      { path: "products", component: () => import("./pages/admin/Products.vue") },
      { path: "categories", component: () => import("./pages/admin/Categories.vue") },
      { path: "trash", component: () => import("./pages/admin/Trash.vue") }
    ]
  },
  // Catch All
  {
    path: "/:pathMatch(.*)*",
    component: () => import("./pages/NotFound.vue")
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation Guards
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("token");
  const adminToken = localStorage.getItem("adminToken");

  if (to.meta.requiresAdmin) {
    if (!adminToken) {
      next("/admin/login");
    } else {
      next();
    }
  } else if (to.meta.requiresAuth) {
    if (!token) {
      next("/login");
    } else {
      next();
    }
  } else {
    next();
  }
});

export default router;

import { createRouter, createWebHistory } from "vue-router";

import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import Product_list from "@/views/Products/product_list.vue";
import Bidder_list from "@/views/Bidders/bidder_list.vue";
import Tender_list from "@/views/Tenders/tender_list.vue";
import User_manager from "@/views/user manager/user_manager.vue";
import Role from "@/views/user manager/role.vue";
import Permission from "@/views/user manager/permission.vue";
import { useLoginStore } from "@/stores/login";



const routes = [
  {
    path: "/",
    name: "login",
    component: Login,
  },
  {
    path: "/home",
    name: "home",
    component: Home,
    meta: { permission: "Dashboard" },
  },
  {
    path: "/product",
    name: "product_list",
    component: Product_list,
    meta: { permission: "Product" },
  },
  {
    path: "/bidders",
    name: "bidder_list",
    component: Bidder_list,
    meta: { permission: "Bidder" },
  },
  {
    path: "/tender_list",
    name: "tender",
    component: Tender_list,
    meta: { permission: "Tender" },
  },
  {
    path: "/user_manager",
    name: "user_manager",
    component: User_manager,
    meta: { permission: "User manager" },
  },
  {
    path: "/role",
    name: "role",
    component: Role,
    meta: { permission: "Role" },
  },
  {
    path: "/permission",
    name: "permission",
    component: Permission,
    meta: { permission: "Permission" },
  },
  {
    path: "/:catchAll(.*)",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export const firstAccessibleRouteName = (loginStore) =>
  routes.find(
    (route) => route.meta?.permission && loginStore.hasPermission(route.meta.permission)
  )?.name;

router.beforeEach((to) => {
  if (!to.meta.permission) return true;

  const loginStore = useLoginStore();
  if (!loginStore.token) return { name: "login" };

  if (!loginStore.hasPermission(to.meta.permission)) {
    const fallbackName = firstAccessibleRouteName(loginStore);
    return { name: fallbackName || "login" };
  }

  return true;
});

export default router;

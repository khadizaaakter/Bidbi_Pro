import { createRouter, createWebHistory } from "vue-router";

import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import Product_list from "@/views/Products/product_list.vue";

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
  },

  {
    path: "/product_list",
    name: "product_list",
    component: Product_list,
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

export default router;

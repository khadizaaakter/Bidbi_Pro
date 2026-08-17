import { createRouter, createWebHistory } from "vue-router";

import Login from "@/views/Login.vue";
import Home from "@/views/Home.vue";
import Product_list from "@/views/Products/product_list.vue";
import Bidder_list from "@/views/Bidders/bidder_list.vue";
import Tender_list from "@/views/Tenders/tender_list.vue";



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
    path: "/product",
    name: "product_list",
    component: Product_list,
  },
  {
    path: "/bidders",
    name: "bidder_list",
    component: Bidder_list,
  },
  {
    path: "/tender_list",
    name: "tender",
    component: Tender_list,
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

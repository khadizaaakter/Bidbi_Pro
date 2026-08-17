<template>
  <a-layout class="app-shell">
    <Header @toggle-menu="mobileOpen = !mobileOpen" />
    <a-layout class="app-row">
      <SIdebar v-model:collapsed="collapsed" v-model:mobile-open="mobileOpen" />
      <a-layout class="app-body" :class="{ 'app-body--collapsed': collapsed }">
        <a-layout-content class="app-content">
          <div class="container mx-auto py-6">
            <slot></slot>
          </div>
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

import Header from "@/components/layouts/Header.vue";
import SIdebar from "@/components/layouts/SIdebar.vue";

const collapsed = ref(false);
const mobileOpen = ref(false);

const route = useRoute();
watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  }
);

watch(mobileOpen, (open) => {
  document.body.style.overflow = open ? "hidden" : "";
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f4f2ea;
}

.app-body {
  margin-left: 248px;
  transition: margin-left 0.2s ease;
}

.app-body--collapsed {
  margin-left: 80px;
}

.app-content {
  min-height: calc(100vh - 64px);
  background: #fff;
}

@media (max-width: 767px) {
  .app-body,
  .app-body--collapsed {
    margin-left: 0;
  }
}
</style>

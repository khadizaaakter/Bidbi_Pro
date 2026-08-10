<template>
  <a-layout class="app-shell">
    <Header />
    <a-layout>
      <SIdebar />
      <a-layout-content class="app-content">
        <div class="container mx-auto py-6">
          <slot></slot>
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import Header from "@/components/layouts/Header.vue";
import SIdebar from "@/components/layouts/SIdebar.vue";
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f4f2ea;
}

.app-content {
  min-height: calc(100vh - 64px);
  background: #fff;
}
</style>

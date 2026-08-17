<script setup>
import MenuList from "@/components/layouts/MenuList.vue";

const collapsed = defineModel("collapsed", { type: Boolean, default: false });
const mobileOpen = defineModel("mobileOpen", { type: Boolean, default: false });

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
};

const closeMobile = () => {
  mobileOpen.value = false;
};
</script>

<template>
  <a-layout-sider
    v-model:collapsed="collapsed"
    :trigger="null"
    collapsible
    breakpoint="lg"
    :width="248"
    :collapsed-width="80"
    class="app-sider"
  >
    <div class="brand" :class="{ collapsed: collapsed }">
      <div class="brand-icon">B</div>
      <transition name="fade">
        <span v-if="!collapsed" class="brand-text">Bidbi<span class="accent">Pro</span></span>
      </transition>
    </div>

    <MenuList :collapsed="collapsed" />

    <button type="button" class="collapse-trigger" @click="toggleCollapsed">
      <i class="bx" :class="collapsed ? 'bx-chevron-right' : 'bx-chevron-left'"></i>
    </button>
  </a-layout-sider>

  <div class="mobile-backdrop" :class="{ open: mobileOpen }" @click="closeMobile"></div>

  <div class="mobile-drawer" :class="{ open: mobileOpen }">
    <div class="brand">
      <div class="brand-icon">B</div>
      <span class="brand-text">Bidbi<span class="accent">Pro</span></span>
      <button type="button" class="drawer-close" @click="closeMobile" aria-label="Close menu">
        <i class="bx bx-x"></i>
      </button>
    </div>

    <MenuList :collapsed="false" />
  </div>
</template>

<style scoped lang="scss">
.app-sider {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  z-index: 50;
  background: #1e3d2a !important;
  box-shadow: 6px 0 24px -14px rgba(0, 0, 0, 0.45);
}

:deep(.ant-layout-sider-children) {
  background: #1e3d2a !important;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 64px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;

  &.collapsed {
    justify-content: center;
    padding: 0;
  }
}

.brand-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
  background: linear-gradient(135deg, #4a9268, #1e3d2a);
  color: #fff;
  font-weight: 800;
  font-size: 16px;
  box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.5);
}

.brand-text {
  font-size: 16px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.01em;
  white-space: nowrap;

  .accent {
    color: #8fce9f;
    font-weight: 600;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.collapse-trigger {
  position: absolute;
  top: 26px;
  right: -13px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #285239;
  font-size: 15px;
  cursor: pointer;
  z-index: 5;
  box-shadow: 0 6px 14px -4px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s ease, background 0.2s ease;

  &:hover {
    background: #eaf1ec;
    transform: scale(1.1);
  }
}

.drawer-close {
  display: none;
  margin-left: auto;
  width: 30px;
  height: 30px;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.16);
  }
}

.mobile-backdrop {
  display: none;
}

.mobile-drawer {
  display: none;
}

@media (max-width: 767px) {
  .app-sider {
    display: none;
  }

  .mobile-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 90;
    background: rgba(15, 23, 17, 0.55);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;

    &.open {
      opacity: 1;
      pointer-events: auto;
    }
  }

  .mobile-drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: min(80vw, 280px);
    z-index: 95;
    background: #1e3d2a;
    box-shadow: 6px 0 24px -14px rgba(0, 0, 0, 0.45);
    transform: translateX(-100%);
    transition: transform 0.25s ease;

    &.open {
      transform: translateX(0);
    }

    .drawer-close {
      display: flex;
    }

    :deep(.menu-list) {
      flex: 1;
    }
  }
}
</style>

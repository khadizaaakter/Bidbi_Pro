<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useLoginStore } from "@/stores/login";
import { showNotification } from "@/utilities/notification";

const router = useRouter();
const loginStore = useLoginStore();

defineEmits(["toggle-menu"]);

const menuOpen = ref(false);
const userMenuRef = ref(null);

const getUserName = () => {
    return loginStore.user?.name || loginStore.user?.email || "Account";
};
const getUserInitial = (name) => {
  return name ? name.charAt(0).toUpperCase() : "U";
};

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value;
};

const closeMenu = () => {
  menuOpen.value = false;
};

const handleClickOutside = (event) => {
  if (menuOpen.value && userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    closeMenu();
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));

const handleLogout = async () => {
  try {
    const data = await loginStore.logout();
    showNotification("success", data.message || "Logged out successfully");
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    router.push({ name: "login" });
  }
};
</script>

<template>
  <header class="app-header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'home' }" class="brand">

      </RouterLink>

      <button
        class="menu-toggle"
        type="button"
        aria-label="Open menu"
        @click="$emit('toggle-menu')"
      >
        <i class="bx bx-menu"></i>
      </button>

      <div class="header-actions">
        <!-- <button class="icon-btn" type="button" aria-label="Notifications">
          <i class="bx bx-bell"></i>
        </button> -->

        <div class="user-menu" ref="userMenuRef">
          <button class="user-trigger" type="button" @click="toggleMenu">
            <span class="avatar">{{ getUserInitial(getUserName()) }}</span>
            <span class="user-name">{{ getUserName() }}</span>
            <i class="bx bx-chevron-down" :class="{ open: menuOpen }"></i>
          </button>
 
          <transition name="fade-slide">
            <div v-if="menuOpen" class="dropdown">
              <button class="dropdown-item" type="button" @click="handleLogout">
                <i class="bx bx-log-out"></i>
                <span>Log Out</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.app-header {
  position: sticky;
  top: 0;
  z-index: 40;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #e7e4d6;
  box-shadow: 0 2px 12px -6px rgba(40, 82, 57, 0.12);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  max-width: 1440px;
  margin: 0 auto;
}

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: #f6f7f0;
  color: #285239;
  font-size: 20px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #e7e4d6;
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-mark {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #285239, #1e3d2a);
  color: #fff;
  font-size: 18px;
}

.brand-text {
  font-size: 18px;
  font-weight: 800;
  color: #2b2e24;
  letter-spacing: -0.01em;

  span {
    color: #4c6255;
    font-weight: 600;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: none;
  background: #f6f7f0;
  color: #285239;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #e7e4d6;
  }
}

.user-menu {
  position: relative;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 6px 8px 6px 6px;
  border-radius: 12px;
  transition: background 0.2s ease;

  &:hover {
    background: #f6f7f0;
  }
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #285239;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: #2b2e24;
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bx-chevron-down {
  font-size: 16px;
  color: #6b7461;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  min-width: 170px;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e7e4d6;
  box-shadow: 0 20px 40px -16px rgba(40, 82, 57, 0.28);
  padding: 6px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  border: none;
  background: transparent;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #b3261e;
  cursor: pointer;
  transition: background 0.2s ease;

  i {
    font-size: 17px;
  }

  &:hover {
    background: #fbeceb;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 767px) {
  .menu-toggle {
    display: flex;
  }
}

@media (max-width: 640px) {
  .user-name {
    display: none;
  }

  .header-inner {
    padding: 0 16px;
  }
}
</style>

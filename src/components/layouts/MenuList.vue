<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import {
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  TeamOutlined,
  FileDoneOutlined,
  BarChartOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons-vue";

defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const selectedKeys = ref([route.name]);
const openKeys = ref([]);

watch(
  () => route.name,
  (name) => {
    selectedKeys.value = [name];
  }
);
</script>

<template>
  <a-menu
    v-model:selectedKeys="selectedKeys"
    v-model:openKeys="openKeys"
    :inline-collapsed="collapsed"
    theme="dark"
    mode="inline"
    class="menu-list"
  >
    <a-menu-item key="home" title="Dashboard">
      <router-link :to="{ name: 'home' }">
        <dashboard-outlined />
        <span>Dashboard</span>
      </router-link>
    </a-menu-item>
    <a-menu-item key="product_list" title="Product">
      <router-link :to="{ name: 'product_list' }">
        <project-outlined />
        <span>Product</span>
      </router-link>
    </a-menu-item>
  </a-menu>
</template>

<style scoped lang="scss">
.menu-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 12px 0 16px;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 999px;
  }
}

:deep(.ant-menu) {
  background: transparent;
  border-inline-end: none !important;
}

:deep(.ant-menu-item) {
  display: flex;
  align-items: center;
  gap: 12px;
  width: calc(100% - 24px);
  height: 42px;
  line-height: 42px;
  margin: 3px 12px !important;
  padding-inline: 14px !important;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.72);
  font-weight: 500;
  transition: background 0.2s ease, color 0.2s ease;

  a {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
  }

  .anticon {
    font-size: 17px;
    flex-shrink: 0;
  }
}

:deep(.ant-menu-item::after) {
  display: none;
}

:deep(.ant-menu-item:not(.ant-menu-item-selected):not(.ant-menu-item-disabled):hover) {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

:deep(.ant-menu-item-selected) {
  background: linear-gradient(135deg, #f6f7f0, #68a781) !important;
  color: #1e3d2a !important;
  box-shadow: 0 8px 18px -8px rgba(0, 0, 0, 0.55);

  a {
    color: #1e3d2a;
  }
}

:deep(.ant-menu-item-disabled) {
  color: rgba(255, 255, 255, 0.35) !important;

  .anticon {
    color: rgba(255, 255, 255, 0.35) !important;
  }
}

:deep(.ant-menu-divider) {
  margin: 8px 20px;
  background: rgba(255, 255, 255, 0.08);
}

.soon-badge {
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 16px;
}
</style>

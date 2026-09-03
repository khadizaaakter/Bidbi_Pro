<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import {
  FileDoneOutlined,
  TeamOutlined,
  ProjectOutlined,
  UserOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase } from "@/utilities/config";
import { showNotification, extractErrorMessage } from "@/utilities/notification";

const loginStore = useLoginStore();

const canView = (permissionName) => loginStore.hasPermission(permissionName);

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const userName = () => loginStore.user?.name || "there";

const todayLabel = () =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const tenderStats = ref({ total: 0, active: 0 });
const bidderStats = ref({ total: 0 });
const productStats = ref({ total: 0, active: 0 });
const userStats = ref({ total: 0 });

const tenderLoading = ref(true);
const bidderLoading = ref(true);
const productLoading = ref(true);
const userLoading = ref(true);

const recentTenders = ref([]);

const fetchTenderOverview = async () => {
  tenderLoading.value = true;

  try {
    const [listResponse, activeResponse] = await Promise.all([
      axios.get(`${apiBase}/admin/tenders`, {
        ...loginStore.getTokenConfig,
        params: { page: 1, per_page: 10 },
      }),
      axios.get(`${apiBase}/admin/tenders`, {
        ...loginStore.getTokenConfig,
        params: { page: 1, per_page: 1, status: "Active" },
      }),
    ]);

    recentTenders.value = listResponse.data.tenders || [];
    tenderStats.value.total =
      listResponse.data.meta?.total ?? recentTenders.value.length;
    tenderStats.value.active = activeResponse.data.meta?.total ?? 0;
  } catch (error) {
    showNotification(
      "error",
      extractErrorMessage(error.response?.data, "Failed to load tender overview")
    );
  } finally {
    tenderLoading.value = false;
  }
};

const fetchBidderOverview = async () => {
  bidderLoading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/customers`, {
      ...loginStore.getTokenConfig,
      params: { page: 1, per_page: 1 },
    });

    bidderStats.value.total = response.data.meta?.total ?? 0;
  } catch (error) {
    showNotification(
      "error",
      extractErrorMessage(error.response?.data, "Failed to load bidder overview")
    );
  } finally {
    bidderLoading.value = false;
  }
};

const fetchProductOverview = async () => {
  productLoading.value = true;

  try {
    const response = await axios.get(
      `${apiBase}/admin/products`,
      loginStore.getTokenConfig
    );

    const products = response.data.products || [];
    productStats.value.total = products.length;
    productStats.value.active = products.filter(
      (product) => product.status === "Active"
    ).length;
  } catch (error) {
    showNotification(
      "error",
      extractErrorMessage(error.response?.data, "Failed to load product overview")
    );
  } finally {
    productLoading.value = false;
  }
};

const fetchUserOverview = async () => {
  userLoading.value = true;

  try {
    const response = await axios.get(
      `${apiBase}/user_list`,
      loginStore.getTokenConfig
    );

    userStats.value.total = (response.data.users || []).length;
  } catch (error) {
    showNotification(
      "error",
      extractErrorMessage(error.response?.data, "Failed to load user overview")
    );
  } finally {
    userLoading.value = false;
  }
};

onMounted(() => {
  if (canView("Tender")) fetchTenderOverview();
  else tenderLoading.value = false;

  if (canView("Bidder")) fetchBidderOverview();
  else bidderLoading.value = false;

  if (canView("Product")) fetchProductOverview();
  else productLoading.value = false;

  if (canView("User manager")) fetchUserOverview();
  else userLoading.value = false;
});
</script>

<template>
  <MainLayout>
    <div class="dashboard-page">
      <!-- <div class="welcome-card">
        <div>
          <h1 class="welcome-title">{{ greeting() }}, {{ userName() }}</h1>
          <p class="welcome-subtitle">{{ todayLabel() }}</p>
        </div>
      </div> -->

      <div class="stats-grid">
        <div v-if="canView('Tender')" class="stat-card">
          <div class="stat-icon tender-icon">
            <FileDoneOutlined />
          </div>
          <div class="stat-info">
            <span class="stat-label">Tenders</span>
            <span class="stat-value">{{ tenderLoading ? "..." : tenderStats.total }}</span>
            <span v-if="!tenderLoading" class="stat-sub">{{ tenderStats.active }} Active</span>
          </div>
        </div>

        <div v-if="canView('Bidder')" class="stat-card">
          <div class="stat-icon bidder-icon">
            <TeamOutlined />
          </div>
          <div class="stat-info">
            <span class="stat-label">Bidders</span>
            <span class="stat-value">{{ bidderLoading ? "..." : bidderStats.total }}</span>
          </div>
        </div>

        <div v-if="canView('Product')" class="stat-card">
          <div class="stat-icon product-icon">
            <ProjectOutlined />
          </div>
          <div class="stat-info">
            <span class="stat-label">Products</span>
            <span class="stat-value">{{ productLoading ? "..." : productStats.total }}</span>
            <span v-if="!productLoading" class="stat-sub">{{ productStats.active }} Active</span>
          </div>
        </div>

        <div v-if="canView('User manager')" class="stat-card">
          <div class="stat-icon user-icon">
            <UserOutlined />
          </div>
          <div class="stat-info">
            <span class="stat-label">Users</span>
            <span class="stat-value">{{ userLoading ? "..." : userStats.total }}</span>
          </div>
        </div>
      </div>

      <div v-if="canView('Tender')" class="table-card">
        <div class="table-card-header">
          <h2 class="table-card-title">Recent Tenders</h2>
          <router-link :to="{ name: 'tender' }" class="view-all-link">
            View all
            <ArrowRightOutlined />
          </router-link>
        </div>

        <table class="recent-table">
          <thead>
            <tr>
              <th>Reference Code</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Closing Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="tenderLoading">
              <td colspan="5" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!recentTenders.length">
              <td colspan="5" class="state-cell">No tenders found</td>
            </tr>
            <template v-else>
              <tr v-for="tender in recentTenders" :key="tender.tender_id">
                <td data-label="Reference Code">{{ tender.ref_code }}</td>
                <td data-label="Product">{{ tender.product_name }}</td>
                <td data-label="Quantity" class="text-right">{{ tender.quantity || "-" }}</td>
                <td data-label="Closing Date">{{ tender.closing_date || "-" }}</td>
                <td data-label="Status">
                  <span :class="['status-badge', tender.status?.toLowerCase()]">
                    {{ tender.status }}
                  </span>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.welcome-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #285239, #1e3d2a);
  border-radius: 16px;
  padding: 28px 32px;
  color: #fff;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.5);
}

.welcome-title {
  font-size: 22px;
  font-weight: 800;
  margin: 0 0 6px;
  letter-spacing: -0.01em;
}

.welcome-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.75);
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.25);
}

.stat-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  font-size: 22px;

  &.tender-icon {
    background: #e7f3ea;
    color: #285239;
  }

  &.bidder-icon {
    background: #eef2ff;
    color: #3949ab;
  }

  &.product-icon {
    background: #fff4e0;
    color: #b76e00;
  }

  &.user-icon {
    background: #f0e9fb;
    color: #6a3fb5;
  }
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7461;
}

.stat-value {
  font-size: 24px;
  font-weight: 800;
  color: #2b2e24;
  line-height: 1.2;
}

.stat-sub {
  font-size: 12px;
  font-weight: 600;
  color: #285239;
}

.table-card {
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.25);
  overflow-x: auto;
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 4px;
}

.table-card-title {
  font-size: 16px;
  font-weight: 800;
  color: #2b2e24;
  margin: 0;
}

.view-all-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #285239;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.recent-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;

  th {
    background: #f6f7f0;
    color: #45493d;
    font-weight: 700;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid #e7e4d6;
    border-right: 1px solid #e7e4d6;

    &:last-child {
      border-right: none;
    }
  }

  td {
    font-size: 14px;
    color: #2b2e24;
    padding: 12px 16px;
    border-bottom: 1px solid #f0efe4;
    border-right: 1px solid #f0efe4;

    &:last-child {
      border-right: none;
    }
  }

  tbody tr:hover td {
    background: #f6f7f0;
  }

  .state-cell {
    text-align: center;
    color: #6b7461;
    padding: 24px 16px;
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;

  &.active,
  &.open {
    background: #e7f3ea;
    color: #285239;
  }

  &.inactive,
  &.closed {
    background: #fbeceb;
    color: #b3261e;
  }

  &.awarded {
    background: #eaf1fb;
    color: #1d4ed8;
  }
}

.text-right {
  text-align: right;
}

@media (max-width: 640px) {
  .welcome-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .dashboard-page {
    gap: 14px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .stat-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-radius: 14px;
  }

  .stat-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    font-size: 18px;
  }

  .stat-label {
    font-size: 11px;
  }

  .stat-value {
    font-size: 20px;
  }

  .table-card {
    padding: 0;
    border-radius: 14px;
    overflow-x: visible;
  }

  .table-card-header {
    padding: 14px 14px 10px;
  }

  .recent-table {
    min-width: 0;

    thead {
      display: none;
    }

    tbody,
    tr,
    td {
      display: block;
      width: 100%;
    }

    tr {
      padding: 12px 14px;
      border-bottom: 1px solid #f0efe4;
    }

    tr:last-child {
      border-bottom: none;
    }

    td {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 6px 0;
      border: none;
      text-align: right;
    }

    td::before {
      content: attr(data-label);
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      color: #6b7461;
      text-align: left;
    }

    .state-cell {
      display: block;
      text-align: center;
      padding: 24px 14px;
    }

    .state-cell::before {
      content: none;
    }
  }
}

@media (max-width: 380px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

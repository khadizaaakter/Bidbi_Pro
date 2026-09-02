<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase } from "@/utilities/config";
import {
  showNotification,
  extractErrorMessage,
  isErrorResponse,
} from "@/utilities/notification";

const loginStore = useLoginStore();

const allApprovals = ref([]);
const loading = ref(false);

const pageSize = 25;
const currentPage = ref(1);

const statusFilter = ref("pending");
const searchQuery = ref("");

const normalizeApproval = (row) => ({
  tender_id: row.tender?.tender_id ?? row.tender_id ?? row.id,
  ref_code: row.tender?.ref_code ?? row.ref_code ?? "-",
  product_code: row.tender?.product_code ?? row.product_code ?? "-",
  product_name: row.tender?.product_name ?? row.product_name ?? "-",
  closing_date: row.tender?.closing_date ?? row.closing_date ?? "-",
  status: row.tender?.status ?? row.status ?? "-",
  winner_id: row.tender?.winner_id ?? row.winner_id ?? null,
  active: row.tender?.active ?? row.active,
  total_bidders: row.total_bidders ?? 0,
  top_bidder_name:
    row.top_bidder?.customer_name ?? row.top_bidder?.customer_code ?? "-",
});

const statusLabel = (row) => {
  if (row.active === "N" || row.active === 0 || row.active === false) return "Closed";
  if (row.winner_id) return "Accepted";
  return "Pending";
};

const statusClass = (row) => statusLabel(row).toLowerCase();

const fetchApprovals = async () => {
  loading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/bidder-approvals`, {
      ...loginStore.getTokenConfig,
      params: {
        status: statusFilter.value || undefined,
        page: 1,
        per_page: 100000,
      },
    });

    const rows = response.data.tenders || response.data.data || response.data.bidder_approvals || [];
    allApprovals.value = rows.map(normalizeApproval);
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to load bidder approvals"
    );
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const searchableText = (row) =>
  [row.ref_code, row.product_code, row.product_name, row.top_bidder_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchesSearch = (row) => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return true;

  const words = query.split(/\s+/).filter(Boolean);
  const haystack = searchableText(row);

  return words.every((word) => haystack.includes(word));
};

const filteredApprovals = () => allApprovals.value.filter(matchesSearch);

const totalPages = () => Math.max(1, Math.ceil(filteredApprovals().length / pageSize));

const approvals = () => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredApprovals().slice(start, start + pageSize);
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages()) return;
  currentPage.value = page;
};

const onFilterChange = () => {
  currentPage.value = 1;
  fetchApprovals();
};

const onSearchInput = () => {
  currentPage.value = 1;
};

// top 3 bidders modal
const showBiddersModal = ref(false);
const biddersLoading = ref(false);
const biddersTender = ref(null);
const bidders = ref([]);
const biddersActions = ref({ can_accept: false, can_cancel: false });

const openBiddersModal = async (row) => {
  showBiddersModal.value = true;
  biddersLoading.value = true;
  biddersTender.value = row;
  bidders.value = [];
  biddersActions.value = { can_accept: false, can_cancel: false };

  try {
    const response = await axios.get(
      `${apiBase}/admin/bidder-approvals/${row.tender_id}`,
      loginStore.getTokenConfig
    );

    biddersTender.value = response?.data?.tender || row;
    bidders.value = response?.data?.bidders || [];
    biddersActions.value = response?.data?.actions || { can_accept: false, can_cancel: false };
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to load top bidders"
    );
    showNotification("error", message);
    showBiddersModal.value = false;
  } finally {
    biddersLoading.value = false;
  }
};

const closeBiddersModal = () => {
  showBiddersModal.value = false;
  biddersTender.value = null;
  bidders.value = [];
  biddersActions.value = { can_accept: false, can_cancel: false };
};

// the backend always declares the highest (1st position) bid the winner -
// 2nd/3rd are backups only and are never accepted
const primaryBidder = () => bidders.value.find((bidder) => bidder.role === "primary") ?? null;

const canAccept = () => biddersActions.value.can_accept && !!primaryBidder();

// accept confirmation
const showAcceptModal = ref(false);
const actionLoading = ref(false);
const selectedBidder = ref(null);

const openAcceptModal = () => {
  selectedBidder.value = primaryBidder();
  showAcceptModal.value = true;
};

const closeAcceptModal = () => {
  showAcceptModal.value = false;
  selectedBidder.value = null;
};

const confirmAccept = async () => {
  if (!selectedBidder.value || !biddersTender.value) return;

  actionLoading.value = true;

  try {
    const response = await axios.post(
      `${apiBase}/admin/bidder-approvals/${biddersTender.value.tender_id}/accept`,
      { customer_code: selectedBidder.value.customer_code },
      loginStore.getTokenConfig
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to accept bidder");
      showNotification("error", message);
      return;
    }

    showNotification("success", response?.data?.message || "Bidder accepted successfully");
    closeAcceptModal();
    closeBiddersModal();
    await fetchApprovals();
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to accept bidder"
    );
    showNotification("error", message);
  } finally {
    actionLoading.value = false;
  }
};

// cancel confirmation (tender-level - applies no matter which bidder row triggers it)
const showCancelModal = ref(false);

const openCancelModal = () => {
  showCancelModal.value = true;
};

const closeCancelModal = () => {
  showCancelModal.value = false;
};

const confirmCancel = async () => {
  if (!biddersTender.value) return;

  actionLoading.value = true;

  try {
    const response = await axios.post(
      `${apiBase}/admin/bidder-approvals/${biddersTender.value.tender_id}/cancel`,
      null,
      loginStore.getTokenConfig
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to cancel bidder");
      showNotification("error", message);
      return;
    }

    showNotification("success", response?.data?.message || "Bid cancelled successfully");
    closeCancelModal();
    closeBiddersModal();
    await fetchApprovals();
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to cancel bidder"
    );
    showNotification("error", message);
  } finally {
    actionLoading.value = false;
  }
};

onMounted(() => {
  fetchApprovals();
});
</script>

<template>
  <MainLayout>
    <div class="approval-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Bidder Approval</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by name or code..."
            @input="onSearchInput"
          />

          <select v-model="statusFilter" class="status-select" @change="onFilterChange">
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="cancelled">Closed</option>
          </select>
        </div>
      </div>

      <div class="table-card">
        <table class="approvals-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Reference Code</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Closing Date</th>
              <th>Top Bidder</th>
              <th>Total Bidders</th>
              <th>Status</th>
              <th>Top 3 Bidders</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!approvals().length">
              <td colspan="9" class="state-cell">No bidder approvals found</td>
            </tr>
            <template v-else>
              <tr v-for="(row, index) in approvals()" :key="row.tender_id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ row.ref_code }}</td>
                <td>{{ row.product_code }}</td>
                <td>{{ row.product_name }}</td>
                <td>{{ row.closing_date }}</td>
                <td>{{ row.top_bidder_name }}</td>
                <td>{{ row.total_bidders }}</td>
                <td>
                  <span :class="['status-badge', statusClass(row)]">
                    {{ statusLabel(row) }}
                  </span>
                </td>
                <td>
                  <button
                    type="button"
                    class="details-btn"
                    @click="openBiddersModal(row)"
                  >
                    View Top 3
                  </button>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!loading && approvals().length" class="pagination">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>

          <span class="page-info">Page {{ currentPage }} of {{ totalPages() }}</span>

          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === totalPages()"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div v-if="showBiddersModal" class="form-modal-backdrop" @click="closeBiddersModal">
        <div class="form-modal-content bidders-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Top 3 Bidders</h2>
            <button type="button" class="form-modal-close" @click="closeBiddersModal">
              &times;
            </button>
          </div>

          <div v-if="biddersLoading" class="state-cell">Loading...</div>

          <template v-else>
            <div class="bidders-tender-info">
              <div class="view-row">
                <span class="view-label">Reference Code</span>
                <span class="view-value">{{ biddersTender?.ref_code || "-" }}</span>
              </div>

              <div class="view-row">
                <span class="view-label">Product</span>
                <span class="view-value">{{ biddersTender?.product_name || "-" }}</span>
              </div>

              <div class="view-row">
                <span class="view-label">Closing Date</span>
                <span class="view-value">{{ biddersTender?.closing_date || "-" }}</span>
              </div>

              <div class="view-row">
                <span class="view-label">Status</span>
                <span class="view-value">{{ biddersTender?.status || "-" }}</span>
              </div>
            </div>

            <div v-if="!bidders.length" class="state-cell">No bidders for this tender</div>

            <div v-else class="bidder-cards">
              <div
                v-for="bidder in bidders"
                :key="bidder.bid_id"
                class="bidder-card"
                :class="{ 'is-winner': bidder.is_winner }"
              >
                <div class="bidder-card-info">
                  <span class="bidder-role" :class="bidder.role">
                    {{ bidder.role === "primary" ? "Highest Bid" : `Backup ${bidder.position - 1}` }}
                  </span>

                  <div class="bidder-name-row">
                    <strong>{{ bidder.customer_name || bidder.customer_code }}</strong>
                    <span v-if="bidder.is_winner" class="winner-tag">Winner</span>
                  </div>

                  <div class="bidder-meta">
                    <span>{{ bidder.customer_code }}</span>
                    <span v-if="bidder.phone">{{ bidder.phone }}</span>
                    <span class="bidder-amount">{{ bidder.amount }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeBiddersModal">
              Close
            </button>
            <button
              type="button"
              class="submit-btn"
              :disabled="!canAccept()"
              @click="openAcceptModal"
            >
              Accept
            </button>
            <button
              type="button"
              class="delete-confirm-btn"
              :disabled="!biddersActions.can_cancel"
              @click="openCancelModal"
            >
              Cancel
            </button>
            
          </div>
        </div>
      </div>

      <div v-if="showAcceptModal" class="form-modal-backdrop" @click="closeAcceptModal">
        <div class="form-modal-content delete-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Accept Bidder</h2>
            <button type="button" class="form-modal-close" @click="closeAcceptModal">
              &times;
            </button>
          </div>

          <p class="delete-confirm-text">
            Accept
            <strong>{{ selectedBidder?.customer_name || selectedBidder?.customer_code }}</strong>
            as the winning bidder for this tender?
          </p>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeAcceptModal">
              Back
            </button>
            <button
              type="button"
              class="submit-btn"
              :disabled="actionLoading"
              @click="confirmAccept"
            >
              {{ actionLoading ? "Accepting..." : "Accept" }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showCancelModal" class="form-modal-backdrop" @click="closeCancelModal">
        <div class="form-modal-content delete-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Cancel Tender</h2>
            <button type="button" class="form-modal-close" @click="closeCancelModal">
              &times;
            </button>
          </div>

          <p class="delete-confirm-text">
            Are you sure you want to cancel this tender? No winner will be assigned.
          </p>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeCancelModal">
              Back
            </button>
            <button
              type="button"
              class="delete-confirm-btn"
              :disabled="actionLoading"
              @click="confirmCancel"
            >
              {{ actionLoading ? "Cancelling..." : "Cancel Tender" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.approval-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: #2b2e24;
  margin: 0;
  letter-spacing: -0.01em;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-input,
.status-select {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #2b2e24;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #285239;
  }
}

.search-input {
  width: 240px;
}

.status-select {
  cursor: pointer;
}

.table-card {
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.25);
  overflow-x: auto;
}

.approvals-table {
  width: 100%;
  min-width: 820px;
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

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 16px 8px 8px;
}

.page-btn {
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #285239;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover:not(:disabled) {
    background: #f6f7f0;
    border-color: #285239;
  }

  &:disabled {
    color: #a7ab9b;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 13px;
  font-weight: 600;
  color: #45493d;
}

.details-btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #285239;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #f6f7f0;
    border-color: #285239;
  }
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;

  &.pending {
    background: #fff6e0;
    color: #9a6d00;
  }

  &.accepted {
    background: #e7f3ea;
    color: #285239;
  }

  &.closed {
    background: #fbeceb;
    color: #b3261e;
  }
}

.form-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 16, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.form-modal-content {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.5);
}

.form-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h2 {
    font-size: 18px;
    font-weight: 800;
    color: #2b2e24;
    margin: 0;
  }
}

.form-modal-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #f6f7f0;
  color: #45493d;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.cancel-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #45493d;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:hover {
    background: #f6f7f0;
  }
}

.delete-modal-content {
  max-width: 420px;
}

.bidders-modal-content {
  max-width: 620px;
}

.bidders-tender-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e7e4d6;
}

.view-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.view-label {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: #6b7461;
}

.view-value {
  font-size: 14px;
  color: #2b2e24;
  font-weight: 600;
}

.bidder-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bidder-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #e7e4d6;
  border-radius: 12px;
  background: #fafaf6;

  &.is-winner {
    border-color: #285239;
    background: #eef6f0;
  }
}

.bidder-card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bidder-role {
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #9a6d00;

  &.primary {
    color: #285239;
  }
}

.bidder-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #2b2e24;
}

.winner-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  background: #285239;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}

.bidder-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  color: #6b7461;
}

.bidder-amount {
  font-weight: 700;
  color: #285239;
}

.delete-confirm-text {
  font-size: 14px;
  color: #45493d;
  line-height: 1.5;
  margin: 0;
}

.delete-confirm-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: #b3261e;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #8f1e18;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.submit-btn {
  height: 38px;
  padding: 0 18px;
  border-radius: 10px;
  border: none;
  background: #285239;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: #1f3f2c;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@media (max-width: 640px) {
  .toolbar-right {
    width: 100%;
  }

  .search-input,
  .status-select {
    width: 100%;
  }

  .form-modal-content {
    padding: 16px;
  }
}
</style>

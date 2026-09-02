<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import axios from "axios";
import {
  EditOutlined,
  DeleteOutlined,
  RedoOutlined,
  EyeOutlined,
  LoadingOutlined,
} from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase, base } from "@/utilities/config";
import {
  showNotification,
  extractErrorMessage,
  isErrorResponse,
} from "@/utilities/notification";

const loginStore = useLoginStore();

const allBidders = ref([]);
const loading = ref(false);
const syncing = ref(false);

// sync bidder
const syncBidders = async () => {
  syncing.value = true;

  try {
    const response = await axios.post(
      `${apiBase}/admin/customers/sync`,
      null,
      loginStore.getTokenConfig
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to sync bidders");
      showNotification("error", message);
      return;
    }

    const message = response?.data?.message || "Bidder synced successfully";
    showNotification("success", message);
    await fetchBidders();
  } catch (error) {
    const message = extractErrorMessage(
      error?.response?.data,
      "Failed to sync bidders"
    );

    showNotification("error", message);
  } finally {
    syncing.value = false;
  }
};

const pageSize = 25;
const currentPage = ref(1);

const searchQuery = ref("");
const statusFilter = ref("");

const searchableText = (bidder) =>
  [
    bidder.name,
    bidder.customer_code,
    bidder.phone,
    bidder.email,
    bidder.address,
    bidder.company_name,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const matchesSearch = (bidder) => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return true;

  const words = query.split(/\s+/).filter(Boolean);
  const haystack = searchableText(bidder);

  return words.every((word) => haystack.includes(word));
};

const filteredBidders = () =>
  allBidders.value.filter(
    (bidder) =>
      (!statusFilter.value || bidder.status === statusFilter.value) &&
      matchesSearch(bidder)
  );

const totalPages = () => Math.max(1, Math.ceil(filteredBidders().length / pageSize));

const paginatedBidders = () => {
  const start = (currentPage.value - 1) * pageSize;
  return filteredBidders().slice(start, start + pageSize);
};

const goToPage = (page) => {
  if (page < 1 || page > totalPages()) return;
  currentPage.value = page;
};

const showViewModal = ref(false);
const viewLoading = ref(false);
const viewCustomer = ref(null);

const openViewModal = async (customer_id) => {
  showViewModal.value = true;
  viewLoading.value = true;
  viewCustomer.value = null;

  try {
    const response = await axios.get(
      `${apiBase}/admin/customers/${customer_id}`,
      loginStore.getTokenConfig
    );

    viewCustomer.value = response.data.customer || response.data.data || response.data;
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to load bidder details"
    );
    showNotification("error", message);
    showViewModal.value = false;
  } finally {
    viewLoading.value = false;
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewCustomer.value = null;
};

const fetchBidders = async () => {
  loading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/customers`, {
      ...loginStore.getTokenConfig,
      params: {
        page: 1,
        per_page: 100000,
      },
    });

    allBidders.value = response.data.customers || [];
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to load Bidders"
    );
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const onFilterChange = () => {
  currentPage.value = 1;
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});

const emptyForm = () => ({
  customer_code: "",
  password: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  status: "Active",
});

const createForm = ref(emptyForm());

const openCreateModal = () => {
  createForm.value = emptyForm();
  createErrors.value = {};
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const submitCreate = async () => {
  creating.value = true;
  createErrors.value = {};

  try {
    const data = new URLSearchParams();
    data.append("customer_code", createForm.value.customer_code);
    data.append("password", createForm.value.password);
    data.append("status", createForm.value.status);
    if (createForm.value.name) data.append("name", createForm.value.name);
    if (createForm.value.phone) data.append("phone", createForm.value.phone);
    if (createForm.value.email) data.append("email", createForm.value.email);
    if (createForm.value.address) data.append("address", createForm.value.address);

    const response = await axios.post(`${apiBase}/admin/customers`, data, {
      headers: {
        ...loginStore.getTokenConfig.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to create Bidder");
      showNotification("error", message);
      return;
    }

    showNotification("success", "Bidder created successfully");
    closeCreateModal();
    await fetchBidders();
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to create Bidder"
    );
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editingBidderId = ref(null);

const emptyEditForm = () => ({
  name: "",
  phone: "",
  status: "Active",
});

const editForm = ref(emptyEditForm());

const openEditModal = (Bidder) => {
  editingBidderId.value = Bidder.id;
  editForm.value = {
    name: Bidder.name || "",
    phone: Bidder.phone || "",
    status: Bidder.status || "Active",
  };
  editErrors.value = {};
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const submitEdit = async () => {
  updating.value = true;
  editErrors.value = {};

  try {
    const data = new URLSearchParams();
    data.append("name", editForm.value.name);
    data.append("phone", editForm.value.phone);
    data.append("status", editForm.value.status);

    const response = await axios.put(
      `${apiBase}/admin/customers/${editingBidderId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to update Bidder");
      showNotification("error", message);
      return;
    }

    showNotification("success", "Bidder updated successfully");
    closeEditModal();
    await fetchBidders();
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to update Bidder"
    );
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const deletingId = ref(null);

const deleteBidder = async (Bidder) => {
  if (!window.confirm(`Are you sure you want to delete "${Bidder.name}"?`)) return;

  deletingId.value = Bidder.id;

  try {
    const response = await axios.delete(
      `${apiBase}/admin/customers/${Bidder.id}`,
      loginStore.getTokenConfig
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to delete Bidder");
      showNotification("error", message);
      return;
    }

    showNotification("success", "Bidder deleted successfully");
    await fetchBidders();
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to delete Bidder"
    );
    showNotification("error", message);
  } finally {
    deletingId.value = null;
  }
};

const statusOptions = ["Active", "Inactive"];
const openStatusId = ref(null);
const statusUpdatingId = ref(null);

const toggleStatusDropdown = (bidder) => {
  openStatusId.value = openStatusId.value === bidder.id ? null : bidder.id;
};

const closeStatusDropdown = () => {
  openStatusId.value = null;
};

const selectStatus = async (bidder, status) => {
  closeStatusDropdown();

  if (bidder.status === status) return;

  statusUpdatingId.value = bidder.id;

  try {
    const response = await axios.patch(
      `${apiBase}/admin/customers/${bidder.id}/status`,
      { status },
      loginStore.getTokenConfig
    );

    if (isErrorResponse(response)) {
      const message = extractErrorMessage(response?.data, "Failed to update status");
      showNotification("error", message);
      return;
    }

    bidder.status = response.data.customer?.status || status;
    showNotification("success", "Bidder status updated successfully");
  } catch (error) {
    const message = extractErrorMessage(
      error.response?.data,
      "Failed to update status"
    );
    showNotification("error", message);
  } finally {
    statusUpdatingId.value = null;
  }
};

const onDocumentClick = (event) => {
  if (openStatusId.value !== null && !event.target.closest(".status-badge-wrap")) {
    closeStatusDropdown();
  }
};

onMounted(() => {
  fetchBidders();
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <MainLayout>
    <div class="bidder-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Bidder</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by name, code, phone, email, address..."
            @input="onFilterChange"
          />

          <select v-model="statusFilter" class="status-select" @change="onFilterChange">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <!-- <button type="button" class="create-btn" @click="openCreateModal">
            + Create
          </button> -->
          <button type="button" class="sync-btn" :disabled="syncing" @click="syncBidders">
            <LoadingOutlined v-if="syncing" />
            <RedoOutlined v-else />
            {{ syncing ? "Syncing..." : "Sync Bidders" }}
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="Bidders-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Customer Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Address</th>
              <th>Company</th>
              <th>Status</th>
              <!-- <th>Action</th> -->
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!paginatedBidders().length">
              <td colspan="8" class="state-cell">No bidders found</td>
            </tr>
            <template v-else>
              <tr v-for="(bidder, index) in paginatedBidders()" :key="bidder.id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ bidder.customer_code }}</td>
                <td>{{ bidder.name }}</td>
                <td>{{ bidder.phone || "-" }}</td>
                <td>{{ bidder.email || "-" }}</td>
                <td>{{ bidder.address || "-" }}</td>
                <td>{{ bidder.company_name || "-" }}</td>
                <td>
                  <div class="status-badge-wrap">
                    <span
                      :class="[
                        'status-badge',
                        'status-badge-clickable',
                        bidder.status?.toLowerCase(),
                      ]"
                      @click.stop="toggleStatusDropdown(bidder)"
                    >
                      <span class="status-dot"></span>
                      {{ statusUpdatingId === bidder.id ? "Saving..." : bidder.status }}
                      <svg class="status-caret" width="10" height="6" viewBox="0 0 10 6" fill="none">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </span>

                    <ul v-if="openStatusId === bidder.id" class="status-dropdown">
                      <li
                        v-for="option in statusOptions"
                        :key="option"
                        :class="[
                          'status-dropdown-item',
                          option.toLowerCase(),
                          { selected: bidder.status === option },
                        ]"
                        @click.stop="selectStatus(bidder, option)"
                      >
                        <span class="status-dot"></span>
                        {{ option }}
                        <svg v-if="bidder.status === option" class="status-check" width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <path d="M3 8.5L6.5 12L13 4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                      </li>
                    </ul>
                  </div>
                </td>
                <!-- <td> -->
                  <!-- <div class="action-buttons"> -->
                    <!-- <button
                      type="button"
                      class="action-btn view-btn"
                      title="Show"
                      @click="openViewModal(bidder.id)"
                    >
                      <EyeOutlined />
                    </button> -->
                    <!-- <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(bidder)"
                    >
                      <EditOutlined />
                    </button> -->
                    <!-- <button
                      type="button"
                      class="action-btn delete-btn"
                      title="Delete"
                      :disabled="deletingId === bidder.id"
                      @click="deleteBidder(bidder)"
                    >
                      <DeleteOutlined />
                    </button> -->
                  <!-- </div> -->
                <!-- </td> -->
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!loading && filteredBidders().length" class="pagination">
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

      <div v-if="showViewModal" class="form-modal-backdrop" @click="closeViewModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Bidder Details</h2>
            <button type="button" class="form-modal-close" @click="closeViewModal">
              &times;
            </button>
          </div>

          <div v-if="viewLoading" class="state-cell">Loading...</div>

          <div v-else-if="viewCustomer" class="view-details">
            <div class="view-row">
              <span class="view-label">Customer Code</span>
              <span class="view-value">{{ viewCustomer.customer_code }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Name</span>
              <span class="view-value">{{ viewCustomer.name }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Phone</span>
              <span class="view-value">{{ viewCustomer.phone || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Email</span>
              <span class="view-value">{{ viewCustomer.email || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Address</span>
              <span class="view-value">{{ viewCustomer.address || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Company</span>
              <span class="view-value">{{ viewCustomer.company_name || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Status</span>
              <span :class="['status-badge', viewCustomer.status?.toLowerCase()]">
                {{ viewCustomer.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create Bidder</h2>
            <button type="button" class="form-modal-close" @click="closeCreateModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitCreate">
            <div class="form-row">
              <label>Customer Code</label>
              <input
                v-model="createForm.customer_code"
                type="text"
                autocomplete="off"
                required
              />
              <span v-if="createErrors.customer_code" class="field-error">{{
                createErrors.customer_code[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Name</label>
              <input v-model="createForm.name" type="text" placeholder="Enter name" />
              <span v-if="createErrors.name" class="field-error">{{
                createErrors.name[0]
              }}</span>
            </div>

            <div class="form-row form-row-split">
              <div>
                <label>Phone</label>
                <input v-model="createForm.phone" type="text" placeholder="Enter phone" />
                <span v-if="createErrors.phone" class="field-error">{{
                  createErrors.phone[0]
                }}</span>
              </div>

              <div>
                <label>Email</label>
                <input
                  v-model="createForm.email"
                  type="email"
                  autocomplete="off"
                  placeholder="Enter email"
                />
                <span v-if="createErrors.email" class="field-error">{{
                  createErrors.email[0]
                }}</span>
              </div>
            </div>

            <div class="form-row">
              <label>Address</label>
              <textarea
                v-model="createForm.address"
                rows="3"
                placeholder="Enter address"
              ></textarea>
              <span v-if="createErrors.address" class="field-error">{{
                createErrors.address[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Password</label>
              <input
                v-model="createForm.password"
                type="password"
                autocomplete="new-password"
                required
              />
              <span v-if="createErrors.password" class="field-error">{{
                createErrors.password[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Status</label>
              <select v-model="createForm.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeCreateModal">
                Cancel
              </button>
              <button type="submit" class="submit-btn" :disabled="creating">
                {{ creating ? "Saving..." : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div v-if="showEditModal" class="form-modal-backdrop" @click="closeEditModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Edit Bidder</h2>
            <button type="button" class="form-modal-close" @click="closeEditModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitEdit">
            <div class="form-row">
              <label>Name</label>
              <input v-model="editForm.name" type="text" required />
              <span v-if="editErrors.name" class="field-error">{{
                editErrors.name[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Phone</label>
              <input v-model="editForm.phone" type="text" />
              <span v-if="editErrors.phone" class="field-error">{{
                editErrors.phone[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Status</label>
              <select v-model="editForm.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeEditModal">
                Cancel
              </button>
              <button type="submit" class="submit-btn" :disabled="updating">
                {{ updating ? "Saving..." : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.bidder-page {
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

.create-btn {
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

  &:hover {
    background: #1f3f2c;
  }
}

.table-card {
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.25);
  overflow-x: auto;
}

.Bidders-table {
  width: 100%;
  min-width: 720px;
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

.price-cell {
  font-weight: 700;
  color: #285239;
}

.Bidder-thumb {
  width: 44px;
  height: 44px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  cursor: pointer;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.08);
  }
}

.no-image {
  font-size: 12px;
  color: #a7ab9b;
}

.image-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(20, 22, 16, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.image-modal-content {
  position: relative;
  max-width: min(90vw, 640px);
  max-height: 90vh;
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.5);

  img {
    display: block;
    max-width: 100%;
    max-height: calc(90vh - 24px);
    border-radius: 8px;
    object-fit: contain;
  }
}

.image-modal-close {
  position: absolute;
  top: -14px;
  right: -14px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #285239;
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px -6px rgba(0, 0, 0, 0.5);
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  background: #fff;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;

  &.view-btn {
    color: #45493d;

    &:hover {
      background: #f6f7f0;
      border-color: #45493d;
    }
  }

  &.edit-btn {
    color: #285239;

    &:hover {
      background: #e7f3ea;
      border-color: #285239;
    }
  }

  &.delete-btn {
    color: #b3261e;

    &:hover {
      background: #fbeceb;
      border-color: #b3261e;
    }
  }
}

.status-badge-wrap {
  position: relative;
  display: inline-block;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
  border: 1px solid transparent;
  line-height: 1;

  &.active {
    background: #e7f3ea;
    color: #285239;
    border-color: #cde7d5;

    .status-dot {
      background: #2f9e5c;
    }
  }

  &.inactive {
    background: #fbeceb;
    color: #b3261e;
    border-color: #f4d4d1;

    .status-dot {
      background: #d64541;
    }
  }
}

.status-badge-clickable {
  cursor: pointer;
  user-select: none;
  transition: box-shadow 0.15s ease, transform 0.1s ease;

  &:hover {
    box-shadow: 0 3px 10px -3px rgba(20, 22, 16, 0.25);
  }

  &:active {
    transform: scale(0.97);
  }
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-caret {
  opacity: 0.6;
  margin-left: 1px;
}

.status-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 20;
  min-width: 130px;
  margin: 0;
  padding: 6px;
  list-style: none;
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 10px;
  box-shadow: 0 12px 28px -12px rgba(40, 82, 57, 0.35);
  animation: status-dropdown-in 0.12s ease-out;
}

@keyframes status-dropdown-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.status-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s ease;

  .status-check {
    margin-left: auto;
  }

  &:hover {
    background: #f6f7f0;
  }

  &.active {
    color: #285239;

    .status-dot {
      background: #2f9e5c;
    }

    &.selected {
      background: #e7f3ea;
    }
  }

  &.inactive {
    color: #b3261e;

    .status-dot {
      background: #d64541;
    }

    &.selected {
      background: #fbeceb;
    }
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

.view-details {
  display: flex;
  flex-direction: column;
  gap: 14px;
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
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 700;
    color: #45493d;
  }

  input,
  select,
  textarea {
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

  input[type="file"] {
    padding: 6px 0;
    border: none;
    height: auto;
  }

  textarea {
    height: auto;
    padding: 10px 14px;
    resize: vertical;
    font-family: inherit;
  }
}

.form-row-split {
  flex-direction: row;
  gap: 16px;

  > div {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  label {
    font-size: 13px;
    font-weight: 700;
    color: #45493d;
  }
}

.field-error {
  font-size: 12px;
  color: #b3261e;
}

.form-image-preview {
  width: 72px;
  height: 72px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  margin-top: 8px;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
}

.sync-btn {
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

  &:hover {
    background: #1f3f2c;
  }
}

@media (max-width: 640px) {
  .toolbar-right {
    width: 100%;
  }

  .search-input,
  .status-select,
  .create-btn {
    width: 100%;
  }

  .form-row-split {
    flex-direction: column;
    gap: 16px;
  }

  .form-modal-content,
  .image-modal-content {
    padding: 16px;
  }
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
</style>

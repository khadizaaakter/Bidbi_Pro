<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import axios from "axios";
import {
  EditOutlined,
  DeleteOutlined,
  RedoOutlined,
  EyeOutlined,
  FileTextOutlined,
} from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase, base } from "@/utilities/config";
import { showNotification } from "@/utilities/notification";

const loginStore = useLoginStore();

const Tenders = ref([]);
const loading = ref(false);
const syncing = ref(false);

// sync tender
const syncTenders = async () => {
  syncing.value = true;

  try {
    const response = await axios.post(
      `${apiBase}/admin/tenders/sync`,
      null,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      const message = response?.data?.message || "Tender synced successfully";

      showNotification("success", message);

      await fetchTenders();
    }
  } catch (error) {
    const message = error?.response?.data?.message || "Failed to sync tenders";

    showNotification("error", message);
  } finally {
    syncing.value = false;
  }
};

const pageSize = 25;
const currentPage = ref(1);
const totalPages = ref(1);

const searchQuery = ref("");
const statusFilter = ref("");

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  fetchTenders();
};

const showViewModal = ref(false);
const viewLoading = ref(false);
const viewTender = ref(null);

const showBidderModal = ref(false);
const bidderLoading = ref(false);
const bidders = ref([]);
const bidderTender = ref(null);
const totalBidders = ref(0);

// get bidders for a tender
const openBidderModal = async (tender) => {
  showBidderModal.value = true;
  bidderLoading.value = true;

  bidders.value = [];
  bidderTender.value = tender;
  totalBidders.value = 0;

  try {
    const response = await axios.get(
      `${apiBase}/admin/tenders/${tender.tender_id}/bidders`,
      loginStore.getTokenConfig
    );

    bidderTender.value = response?.data?.tender || tender;
    bidders.value = response?.data?.bidders || [];
    totalBidders.value = response?.data?.total_bidders || 0;
  } catch (error) {
    const message = error?.response?.data?.message || "Failed to load bidder sheet";

    showNotification("error", message);

    showBidderModal.value = false;
  } finally {
    bidderLoading.value = false;
  }
};
const closeBidderModal = () => {
  showBidderModal.value = false;
  bidderLoading.value = false;
  bidders.value = [];
  bidderTender.value = null;
  totalBidders.value = 0;
};

// open Show Modal
const openViewModal = async (tender_id) => {
  showViewModal.value = true;
  viewLoading.value = true;
  viewTender.value = null;

  try {
    const response = await axios.get(
      `${apiBase}/admin/tenders/${tender_id}`,
      loginStore.getTokenConfig
    );

    viewTender.value = response.data.tender || response.data.data || response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load tender details";
    showNotification("error", message);
    showViewModal.value = false;
  } finally {
    viewLoading.value = false;
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewTender.value = null;
};

// get tenders
const fetchTenders = async () => {
  loading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/tenders`, {
      ...loginStore.getTokenConfig,
      params: {
        page: currentPage.value,
        per_page: pageSize,
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
      },
    });

    Tenders.value = response.data.tenders || [];
    totalPages.value = response.data.meta?.last_page || 1;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load Tenders";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const onFilterChange = () => {
  currentPage.value = 1;
  fetchTenders();
};

let searchDebounce = null;
const onSearchInput = () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(onFilterChange, 400);
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});

const products = ref([]);
const productsLoading = ref(false);

// get products for the product picker
const fetchProducts = async () => {
  productsLoading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/products`, {
      ...loginStore.getTokenConfig,
      params: { status: "Active" },
    });

    products.value = response.data.products || [];
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load products";
    showNotification("error", message);
  } finally {
    productsLoading.value = false;
  }
};

const productSelectRef = ref(null);
const showProductDropdown = ref(false);
const productSearch = ref("");

const filteredProducts = () => {
  const query = productSearch.value.trim().toLowerCase();
  if (!query) return products.value;

  return products.value.filter((product) =>
    `${product.product_code} ${product.name}`.toLowerCase().includes(query)
  );
};

const selectedProductLabel = () => {
  const selected = products.value.find(
    (product) => product.product_code === createForm.value.product_code
  );
  return selected ? `${selected.product_code} - ${selected.name}` : "";
};

const toggleProductDropdown = () => {
  if (productsLoading.value) return;
  showProductDropdown.value = !showProductDropdown.value;
};

const closeProductDropdown = () => {
  showProductDropdown.value = false;
  productSearch.value = "";
};

const selectProduct = (product) => {
  createForm.value.product_code = product.product_code;
  closeProductDropdown();
};

const onDocumentClick = (event) => {
  if (
    showProductDropdown.value &&
    productSelectRef.value &&
    !productSelectRef.value.contains(event.target)
  ) {
    closeProductDropdown();
  }
};

// generate a reference code like TND-20260817-1432-7F3K
const generateRefCode = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();

  return `TND-${y}${m}${d}-${hh}${mm}-${random}`;
};

const emptyForm = () => ({
  ref_code: generateRefCode(),
  product_code: "",
  qty: "",
  closing_date: "",
  notify: true,
});

const createForm = ref(emptyForm());

const openCreateModal = () => {
  createForm.value = emptyForm();
  createErrors.value = {};
  showCreateModal.value = true;
  closeProductDropdown();
  fetchProducts();
};

const closeCreateModal = () => {
  showCreateModal.value = false;
  closeProductDropdown();
};

const toApiDateTime = (datetimeLocal) => {
  if (!datetimeLocal) return "";
  const [datePart, timePart = "00:00"] = datetimeLocal.split("T");
  return `${datePart} ${timePart}:00`;
};

// "2026-08-21 17:00:00" -> "2026-08-21T17:00" for datetime-local inputs
const toDatetimeLocal = (apiDateTime) => {
  if (!apiDateTime) return "";
  const [datePart, timePart = "00:00"] = apiDateTime.split(" ");
  return `${datePart}T${timePart.slice(0, 5)}`;
};

// submit create tender
const submitCreate = async () => {
  creating.value = true;
  createErrors.value = {};

  try {
    const data = new URLSearchParams();
    data.append("product_code", createForm.value.product_code);
    data.append("qty", createForm.value.qty);
    data.append("closing_date", toApiDateTime(createForm.value.closing_date));
    data.append("ref_code", createForm.value.ref_code);
    data.append("notify", createForm.value.notify ? "1" : "0");

    const response = await axios.post(`${apiBase}/admin/tenders`, data, {
      headers: {
        ...loginStore.getTokenConfig.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Tender created successfully");
      closeCreateModal();
      await fetchTenders();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to create tender";
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editingTenderId = ref(null);

const emptyEditForm = () => ({
  ref_code: "",
  qty: "",
  closing_date: "",
});

const editForm = ref(emptyEditForm());

// edit tender
const openEditModal = (Tender) => {
  editingTenderId.value = Tender.tender_id;
  editForm.value = {
    ref_code: Tender.ref_code || "",
    qty: Tender.quantity || "",
    closing_date: toDatetimeLocal(Tender.closing_date),
  };
  editErrors.value = {};
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

// submit edit tender
const submitEdit = async () => {
  updating.value = true;
  editErrors.value = {};

  try {
    const data = new URLSearchParams();
    data.append("qty", editForm.value.qty);
    data.append("closing_date", toApiDateTime(editForm.value.closing_date));

    const response = await axios.put(
      `${apiBase}/admin/tenders/${editingTenderId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response?.status >= 200 && response?.status < 300) {
      const updatedTender = response?.data?.tender;

      if (updatedTender) {
        const index = Tenders.value.findIndex(
          (t) => t.tender_id === updatedTender.tender_id
        );

        if (index !== -1) {
          Tenders.value[index] = {
            ...Tenders.value[index],
            ref_code: updatedTender.ref_code,
            quantity: updatedTender.available_quantity,
            closing_date: updatedTender.end_date,
            cutoff_label: updatedTender.closing_label,
            status: updatedTender.status,
          };
        }
      }

      showNotification("success", "Tender updated successfully");
      closeEditModal();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to update Tender";
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const deletingId = ref(null);
const showDeleteModal = ref(false);
const tenderToDelete = ref(null);

const openDeleteModal = (Tender) => {
  tenderToDelete.value = Tender;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  tenderToDelete.value = null;
};

// delete
const confirmDeleteTender = async () => {
  if (!tenderToDelete.value) return;

  const tenderId = tenderToDelete.value.tender_id;
  deletingId.value = tenderId;

  try {
    const response = await axios.delete(
      `${apiBase}/admin/tenders/${tenderId}`,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Tender deleted successfully");
      closeDeleteModal();
      await fetchTenders();
    }
  } catch (error) {
    const message = error.response?.data?.message || "Failed to delete Tender";
    showNotification("error", message);
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  fetchTenders();
  document.addEventListener("click", onDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onDocumentClick);
});
</script>

<template>
  <MainLayout>
    <div class="tender-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Tender</h1>
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
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <button type="button" class="create-btn" @click="openCreateModal">
            + Create
          </button>
          <!-- <button type="button" class="sync-btn" :disabled="syncing" @click="syncTenders">
            <RedoOutlined />
            {{ syncing ? "Syncing..." : "Sync Tenders" }}
          </button> -->
        </div>
      </div>

      <div class="table-card">
        <table class="Tenders-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Reference Code</th>
              <th>Product Code</th>
              <th>Product Name</th>
              <th>Base Price</th>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Closing Date</th>
              <th>CutOff Label</th>
              <th>My Bid</th>
              <th>Bidder Sheet</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!Tenders.length">
              <td colspan="7" class="state-cell">No tenders found</td>
            </tr>
            <template v-else>
              <tr v-for="(tender, index) in Tenders" :key="tender.tender_id">
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ tender.ref_code }}</td>
                <td>{{ tender.product_code }}</td>
                <td>{{ tender.product_name }}</td>
                <td class="text-right">{{ tender.base_price }}</td>
                <td>{{ tender.unit || "-" }}</td>
                <td class="text-right">{{ tender.quantity || "-" }}</td>
                <td>{{ tender.closing_date || "-" }}</td>
                <td>{{ tender.cutoff_label || "-" }}</td>
                <td>{{ tender.my_bid || "-" }}</td>
                <td>
                  <button
                    type="button"
                    class="bidder-sheet-btn"
                    @click="openBidderModal(tender)"
                  >
                    <FileTextOutlined />
                    Bidder Sheet
                  </button>
                </td>
                <td>
                  <span :class="['status-badge', tender.status?.toLowerCase()]">
                    {{ tender.status }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="action-btn view-btn"
                      title="Show"
                      @click="openViewModal(tender.tender_id)"
                    >
                      <EyeOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(tender)"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn delete-btn"
                      title="Delete"
                      :disabled="deletingId === tender.tender_id"
                      @click="openDeleteModal(tender)"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!loading && Tenders.length" class="pagination">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>

          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>

          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div v-if="showViewModal" class="form-modal-backdrop" @click="closeViewModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Tender Details</h2>
            <button type="button" class="form-modal-close" @click="closeViewModal">
              &times;
            </button>
          </div>

          <div v-if="viewLoading" class="state-cell">Loading...</div>

          <div v-else-if="viewTender" class="view-details">
            <div class="view-row">
              <span class="view-label">Reference Code</span>
              <span class="view-value">{{ viewTender.ref_code }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Product</span>
              <span class="view-value"
                >{{ viewTender.product?.product_code }} -
                {{ viewTender.product?.name }}</span
              >
            </div>

            <div class="view-row">
              <span class="view-label">Base Price</span>
              <span class="view-value">{{
                Number(viewTender.product?.base_price).toFixed(2)
              }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Unit</span>
              <span class="view-value">{{ viewTender.product?.unit || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Quantity</span>
              <span class="view-value">{{ viewTender.quantity_label || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Closing Date</span>
              <span class="view-value">{{ viewTender.end_date_label || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">My Bid</span>
              <span class="view-value">{{ viewTender.my_bid ?? "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Total Bidders</span>
              <span class="view-value">{{ viewTender.total_bidders ?? "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Status</span>
              <span :class="['status-badge', viewTender.status?.toLowerCase()]">
                {{ viewTender.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showBidderModal" class="form-modal-backdrop" @click="closeBidderModal">
        <div class="form-modal-content bidder-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Bidder Sheet</h2>
            <button type="button" class="form-modal-close" @click="closeBidderModal">
              &times;
            </button>
          </div>

          <div v-if="bidderLoading" class="state-cell">Loading...</div>

          <template v-else>
            <div class="bidder-tender-info">
              <div class="view-row">
                <span class="view-label">Reference Code</span>
                <span class="view-value">{{ bidderTender?.ref_code || "-" }}</span>
              </div>

              <div class="view-row">
                <span class="view-label">Product</span>
                <span class="view-value">{{ bidderTender?.product_name || "-" }}</span>
              </div>

              <!-- <div class="view-row">
                <span class="view-label">Status</span>
                <span :class="['status-badge', bidderTender?.status?.toLowerCase()]">
                  {{ bidderTender?.status || "-" }}
                </span>
              </div> -->

              <div class="view-row">
                <span class="view-label">Total Bidders</span>
                <span class="view-value">{{ totalBidders }}</span>
              </div>
            </div>

            <div class="bidder-table-wrap">
              <table class="bidder-sheet-table">
                <thead>
                  <tr>
                    <th>SL</th>
                    <th>Bidder Code</th>
                    <th>Bidder</th>
                    <th>Phone</th>
                    <th>Amount</th>
                    <th>Winner id</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="!bidders.length">
                    <td colspan="8" class="state-cell">No bidders yet</td>
                  </tr>
                  <template v-else>
                    <tr
                      v-for="(bidder, index) in bidders"
                      :key="bidder.customer_id || bidder.id || index"
                      :class="{
                        'winner-row':
                          bidderTender?.winner_id &&
                          (bidder.customer_id || bidder.id) === bidderTender.winner_id,
                      }"
                    >
                      <td>{{ index + 1 }}</td>
                      <td>{{ bidder.customer_code || "-" }}</td>
                      <td>{{ bidder.name || bidder.customer_name || "-" }}</td>
                      <td>{{ bidder.phone || "-" }}</td>
                      <td class="text-right">
                        {{ bidder.amount || "-" }}
                      </td>
                      <td class="text-right">{{ bidderTender?.winner_id || "-" }}</td>
                    </tr>
                  </template>
                </tbody>
              </table>
            </div>
          </template>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create Tender</h2>
            <button type="button" class="form-modal-close" @click="closeCreateModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitCreate">
            <div class="form-row">
              <label>Reference Code</label>
              <input
                v-model="createForm.ref_code"
                type="text"
                readonly
                class="readonly-input"
              />
              <span v-if="createErrors.ref_code" class="field-error">{{
                createErrors.ref_code[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Product</label>
              <select
                v-model="createForm.product_code"
                :disabled="productsLoading"
                required
              >
                <option value="" disabled>
                  {{ productsLoading ? "Loading products..." : "Select a product" }}
                </option>
                <option
                  v-for="product in products"
                  :key="product.product_code"
                  :value="product.product_code"
                >
                  {{ product.product_code }} - {{ product.name }}
                </option>
              </select>
              <span v-if="createErrors.product_code" class="field-error">{{
                createErrors.product_code[0]
              }}</span>
            </div>

            <div class="form-row form-row-split">
              <div>
                <label>Quantity</label>
                <input
                  v-model="createForm.qty"
                  type="number"
                  min="0"
                  placeholder="Enter quantity"
                  required
                />
                <span v-if="createErrors.qty" class="field-error">{{
                  createErrors.qty[0]
                }}</span>
              </div>

              <div>
                <label>Closing Date</label>
                <input v-model="createForm.closing_date" type="datetime-local" required />
                <span v-if="createErrors.closing_date" class="field-error">{{
                  createErrors.closing_date[0]
                }}</span>
              </div>
            </div>

            <div class="form-row form-row-checkbox">
              <label class="checkbox-label">
                <input v-model="createForm.notify" type="checkbox" />
                Notify Bidders
              </label>
              <span v-if="createErrors.notify" class="field-error">{{
                createErrors.notify[0]
              }}</span>
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
            <h2>Edit Tender</h2>
            <button type="button" class="form-modal-close" @click="closeEditModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitEdit">
            <div class="form-row">
              <label>Reference Code</label>
              <input
                v-model="editForm.ref_code"
                type="text"
                readonly
                class="readonly-input"
              />
            </div>

            <div class="form-row">
              <label>Quantity</label>
              <input v-model="editForm.qty" type="number" min="0" required />
              <span v-if="editErrors.qty" class="field-error">{{
                editErrors.qty[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Closing Date</label>
              <input v-model="editForm.closing_date" type="datetime-local" required />
              <span v-if="editErrors.closing_date" class="field-error">{{
                editErrors.closing_date[0]
              }}</span>
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

      <div v-if="showDeleteModal" class="form-modal-backdrop" @click="closeDeleteModal">
        <div class="form-modal-content delete-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Delete Tender</h2>
            <button type="button" class="form-modal-close" @click="closeDeleteModal">
              &times;
            </button>
          </div>

          <p class="delete-confirm-text">
            Are you sure you want to delete tender
            <strong>"{{ tenderToDelete?.ref_code }}"</strong>?
          </p>

          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeDeleteModal">
              Cancel
            </button>
            <button
              type="button"
              class="delete-confirm-btn"
              :disabled="deletingId === tenderToDelete?.tender_id"
              @click="confirmDeleteTender"
            >
              {{ deletingId === tenderToDelete?.tender_id ? "Deleting..." : "Delete" }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.tender-page {
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

.Tenders-table {
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
  }

  td {
    font-size: 14px;
    color: #2b2e24;
    padding: 12px 16px;
    border-bottom: 1px solid #f0efe4;
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

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;

  &.active {
    background: #e7f3ea;
    color: #285239;
  }

  &.inactive {
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

  input.readonly-input {
    background: #f6f7f0;
    color: #6b7461;
    cursor: not-allowed;
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

.form-row-checkbox {
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 700;
    color: #45493d;
    cursor: pointer;
  }

  input[type="checkbox"] {
    width: 16px;
    height: 16px;
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

.delete-modal-content {
  max-width: 420px;
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

.text-right {
  text-align: right;
}

.bidder-sheet-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #285239;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s ease, border-color 0.2s ease;

  &:hover {
    background: #e7f3ea;
    border-color: #285239;
  }
}

.bidder-modal-content {
  max-width: 800px;
}

.bidder-tender-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid #e7e4d6;
}

.bidder-table-wrap {
  overflow-x: auto;
}

.bidder-sheet-table {
  width: 100%;
  min-width: 640px;
  border-collapse: collapse;

  th {
    background: #f6f7f0;
    color: #45493d;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    text-align: left;
    padding: 10px 14px;
    border-bottom: 1px solid #e7e4d6;
  }

  td {
    font-size: 13px;
    color: #2b2e24;
    padding: 10px 14px;
    border-bottom: 1px solid #f0efe4;
  }

  tbody tr:hover td {
    background: #f6f7f0;
  }

  .winner-row td {
    background: #f2f8f2;
    font-weight: 700;
  }

  .state-cell {
    text-align: center;
    color: #6b7461;
    padding: 24px 16px;
  }
}

@media (max-width: 640px) {
  .bidder-modal-content {
    max-width: 100%;
  }
}
</style>

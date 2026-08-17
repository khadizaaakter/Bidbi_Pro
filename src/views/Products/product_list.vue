<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import {
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  RedoOutlined,
} from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase, base } from "@/utilities/config";
import { showNotification } from "@/utilities/notification";

const loginStore = useLoginStore();

const products = ref([]);
const loading = ref(false);
const syyncing = ref(false);

// sync product
const syncProducts = async () => {
  syyncing.value = true;

  try {
    const response = await axios.post(
      `${apiBase}/admin/products/sync`,
      null,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      const message =
        response?.data?.message || "Products synced successfully";

      showNotification("success", message);

      await fetchProducts();
    }
  } catch (error) {
    const message =
      error?.response?.data?.message || "Failed to sync products";

    showNotification("error", message);
  } finally {
    syyncing.value = false;
  }
};

const previewImage = ref(null);

const getImageUrl = (image) => {
  if (!image) return "";
  return image.startsWith("http") ? image : `${base}/${image}`;
};

const openImagePreview = (image) => {
  if (!image) return;
  previewImage.value = getImageUrl(image);
};

const closeImagePreview = () => {
  previewImage.value = null;
};

const pageSize = 20;
const currentPage = ref(1);

const searchQuery = ref("");
const statusFilter = ref("");

const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / pageSize));

const getPaginatedProducts = (items, page) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const goToPage = (page) => {
  if (page < 1 || page > getTotalPages(products.value)) return;
  currentPage.value = page;
};

const fetchProducts = async () => {
  loading.value = true;

  try {
    const response = await axios.get(`${apiBase}/admin/products`, {
      ...loginStore.getTokenConfig,
      params: {
        search: searchQuery.value || undefined,
        status: statusFilter.value || undefined,
      },
    });

    products.value = response.data.products || [];
    currentPage.value = 1;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load products";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

let searchDebounce = null;
const onSearchInput = () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(fetchProducts, 400);
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});
const createImagePreview = ref(null);

const emptyForm = () => ({
  product_code: "",
  name: "",
  base_price: "",
  unit: "",
  description: "",
  status: "Active",
  image: null,
});

const createForm = ref(emptyForm());

const openCreateModal = () => {
  createForm.value = emptyForm();
  createErrors.value = {};
  createImagePreview.value = null;
  showCreateModal.value = true;
};

const closeCreateModal = () => {
  showCreateModal.value = false;
};

const onCreateImageChange = (event) => {
  const file = event.target.files?.[0] || null;
  createForm.value.image = file;
  createImagePreview.value = file ? URL.createObjectURL(file) : null;
};

const submitCreate = async () => {
  creating.value = true;
  createErrors.value = {};

  try {
    const payload = {
      product_code: createForm.value.product_code,
      name: createForm.value.name,
      base_price: createForm.value.base_price,
      unit: createForm.value.unit,
      description: createForm.value.description,
      status: createForm.value.status,
    };

    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));
    if (createForm.value.image) {
      formData.append("image", createForm.value.image);
    }

    const response = await axios.post(
      `${apiBase}/admin/products`,
      formData,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Product created successfully");
      closeCreateModal();
      await fetchProducts();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to create product";
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showViewModal = ref(false);
const viewLoading = ref(false);
const viewProduct = ref(null);

const openViewModal = async (product) => {
  showViewModal.value = true;
  viewLoading.value = true;
  viewProduct.value = null;

  try {
    const response = await axios.get(
      `${apiBase}/admin/products/${product.id}`,
      loginStore.getTokenConfig
    );

    viewProduct.value = response.data.product || response.data.data || response.data;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load product details";
    showNotification("error", message);
    showViewModal.value = false;
  } finally {
    viewLoading.value = false;
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewProduct.value = null;
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editImagePreview = ref(null);
const editingProductId = ref(null);

const emptyEditForm = () => ({
  base_price: "",
  unit: "",
  status: "Active",
  image: null,
});

const editForm = ref(emptyEditForm());

const openEditModal = (product) => {
  editingProductId.value = product.id;
  editForm.value = {
    base_price: product.base_price ?? "",
    unit: product.unit || "",
    status: product.status || "Active",
    image: null,
  };
  editErrors.value = {};
  editImagePreview.value = product.image ? getImageUrl(product.image) : null;
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
};

const onEditImageChange = (event) => {
  const file = event.target.files?.[0] || null;
  editForm.value.image = file;
  editImagePreview.value = file ? URL.createObjectURL(file) : editImagePreview.value;
};

const submitEdit = async () => {
  updating.value = true;
  editErrors.value = {};

  try {
    const formData = new FormData();
    formData.append("base_price", editForm.value.base_price);
    formData.append("unit", editForm.value.unit);
    formData.append("status", editForm.value.status);
    if (editForm.value.image) {
      formData.append("image", editForm.value.image);
    }

    const response = await axios.post(
      `${apiBase}/admin/products/${editingProductId.value}`,
      formData,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Product updated successfully");
      closeEditModal();
      await fetchProducts();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to update product";
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const deletingId = ref(null);

const deleteProduct = async (product) => {
  if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

  deletingId.value = product.id;

  try {
    const response = await axios.delete(
      `${apiBase}/admin/products/${product.id}`,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Product deleted successfully");
      await fetchProducts();
    }
  } catch (error) {
    const message = error.response?.data?.message || "Failed to delete product";
    showNotification("error", message);
  } finally {
    deletingId.value = null;
  }
};

onMounted(fetchProducts);
</script>

<template>
  <MainLayout>
    <div class="product-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Products</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by name or code..."
            @input="onSearchInput"
          />

          <select v-model="statusFilter" class="status-select" @change="fetchProducts">
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <!-- <button type="button" class="create-btn" @click="openCreateModal">+ Create</button> -->
          <button
            type="button"
            class="sync-btn"
            :disabled="syncing"
            @click="syncProducts"
          >
            <RedoOutlined />
            {{ syncing ? "Syncing..." : "Sync Products" }}
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="products-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Product Code</th>
              <th>Name</th>
              <th>Base Price</th>
              <th>Unit</th>
              <th>Image</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="7" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!products.length">
              <td colspan="7" class="state-cell">No products found</td>
            </tr>
            <template v-else>
              <tr
                v-for="(product, index) in getPaginatedProducts(products, currentPage)"
                :key="product.id"
              >
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ product.product_code }}</td>
                <td>{{ product.name }}</td>
                <td class="price-cell">{{ Number(product.base_price).toFixed(2) }}</td>
                <td>{{ product.unit }}</td>
                <td>
                  <img
                    v-if="product.image"
                    :src="getImageUrl(product.image)"
                    :alt="product.name"
                    class="product-thumb"
                    @click="openImagePreview(product.image)"
                  />
                  <span v-else class="no-image">No Image</span>
                </td>
                <td>
                  <span :class="['status-badge', product.status?.toLowerCase()]">
                    {{ product.status }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="action-btn view-btn"
                      title="Show"
                      @click="openViewModal(product)"
                    >
                      <EyeOutlined />
                    </button>
                    <!-- <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(product)"
                    >
                      <EditOutlined />
                    </button> -->
                    <!-- <button
                      type="button"
                      class="action-btn delete-btn"
                      title="Delete"
                      :disabled="deletingId === product.id"
                      @click="deleteProduct(product)"
                    >
                      <DeleteOutlined />
                    </button> -->
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="!loading && products.length" class="pagination">
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>

          <span class="page-info"
            >Page {{ currentPage }} of {{ getTotalPages(products) }}</span
          >

          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === getTotalPages(products)"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div v-if="previewImage" class="image-modal-backdrop" @click="closeImagePreview">
        <div class="image-modal-content" @click.stop>
          <button type="button" class="image-modal-close" @click="closeImagePreview">
            &times;
          </button>
          <img :src="previewImage" alt="Product preview" />
        </div>
      </div>

      <div v-if="showViewModal" class="form-modal-backdrop" @click="closeViewModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Product Details</h2>
            <button type="button" class="form-modal-close" @click="closeViewModal">
              &times;
            </button>
          </div>

          <div v-if="viewLoading" class="state-cell">Loading...</div>

          <div v-else-if="viewProduct" class="view-details">
            <div class="view-row">
              <span class="view-label">Product Code</span>
              <span class="view-value">{{ viewProduct.product_code }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Name</span>
              <span class="view-value">{{ viewProduct.name }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Base Price</span>
              <span class="view-value">{{
                Number(viewProduct.base_price).toFixed(2)
              }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Unit</span>
              <span class="view-value">{{ viewProduct.unit }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Description</span>
              <span class="view-value">{{ viewProduct.description || "-" }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Status</span>
              <span :class="['status-badge', viewProduct.status?.toLowerCase()]">
                {{ viewProduct.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create Product</h2>
            <button type="button" class="form-modal-close" @click="closeCreateModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitCreate">
            <div class="form-row">
              <label>Product Code</label>
              <input v-model="createForm.product_code" type="text" required />
              <span v-if="createErrors.product_code" class="field-error">{{
                createErrors.product_code[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Name</label>
              <input v-model="createForm.name" type="text" required />
              <span v-if="createErrors.name" class="field-error">{{
                createErrors.name[0]
              }}</span>
            </div>

            <div class="form-row form-row-split">
              <div>
                <label>Base Price</label>
                <input
                  v-model="createForm.base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
                <span v-if="createErrors.base_price" class="field-error">{{
                  createErrors.base_price[0]
                }}</span>
              </div>

              <div>
                <label>Unit</label>
                <input
                  v-model="createForm.unit"
                  type="text"
                  placeholder="Enter Unit"
                  required
                />
                <span v-if="createErrors.unit" class="field-error">{{
                  createErrors.unit[0]
                }}</span>
              </div>
            </div>

            <div class="form-row">
              <label>Description</label>
              <textarea v-model="createForm.description" rows="3"></textarea>
              <span v-if="createErrors.description" class="field-error">{{
                createErrors.description[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Status</label>
              <select v-model="createForm.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="form-row">
              <label>Image</label>
              <input type="file" accept="image/*" @change="onCreateImageChange" />
              <img
                v-if="createImagePreview"
                :src="createImagePreview"
                alt="Preview"
                class="form-image-preview"
              />
              <span v-if="createErrors.image" class="field-error">{{
                createErrors.image[0]
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
            <h2>Edit Product</h2>
            <button type="button" class="form-modal-close" @click="closeEditModal">
              &times;
            </button>
          </div>

          <form class="create-form" @submit.prevent="submitEdit">
            <div class="form-row form-row-split">
              <div>
                <label>Base Price</label>
                <input
                  v-model="editForm.base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                />
                <span v-if="editErrors.base_price" class="field-error">{{
                  editErrors.base_price[0]
                }}</span>
              </div>

              <div>
                <label>Unit</label>
                <input
                  v-model="editForm.unit"
                  type="text"
                  placeholder="Enter Unit"
                  required
                />
                <span v-if="editErrors.unit" class="field-error">{{
                  editErrors.unit[0]
                }}</span>
              </div>
            </div>

            <div class="form-row">
              <label>Status</label>
              <select v-model="editForm.status">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div class="form-row">
              <label>Image</label>
              <input type="file" accept="image/*" @change="onEditImageChange" />
              <img
                v-if="editImagePreview"
                :src="editImagePreview"
                alt="Preview"
                class="form-image-preview"
              />
              <span v-if="editErrors.image" class="field-error">{{
                editErrors.image[0]
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
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.product-page {
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

.table-card {
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 16px;
  padding: 8px;
  box-shadow: 0 20px 40px -28px rgba(40, 82, 57, 0.25);
  overflow-x: auto;
}

.products-table {
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
  text-align: right;
}

.product-thumb {
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

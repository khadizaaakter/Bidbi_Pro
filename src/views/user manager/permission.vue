<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase } from "@/utilities/config";
import { showNotification } from "@/utilities/notification";

const loginStore = useLoginStore();

const permissions = ref([]);
const loading = ref(false);

const fetchPermissions = async () => {
  loading.value = true;

  try {
    const response = await axios.get(
      `${apiBase}/permission_list`,
      loginStore.getTokenConfig
    );

    permissions.value = response.data.permission || [];
    currentPage.value = 1;
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to load permissions";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const pageSize = 20;
const currentPage = ref(1);
const searchQuery = ref("");

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFilteredPermissions = (items, query) => {
  if (!query) return items;
  const term = query.toLowerCase();
  return items.filter((permission) => permission.name?.toLowerCase().includes(term));
};

const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / pageSize));

const getPaginatedPermissions = (items, page) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const goToPage = (page) => {
  const filtered = getFilteredPermissions(permissions.value, searchQuery.value);
  if (page < 1 || page > getTotalPages(filtered)) return;
  currentPage.value = page;
};

const onSearchInput = () => {
  currentPage.value = 1;
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});

const emptyCreateForm = () => ({
  name: "",
});

const createForm = ref(emptyCreateForm());

const openCreateModal = () => {
  createForm.value = emptyCreateForm();
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
    data.append("name", createForm.value.name);

    const response = await axios.post(`${apiBase}/permissions`, data, {
      headers: {
        ...loginStore.getTokenConfig.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Permission created successfully");
      closeCreateModal();
      await fetchPermissions();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message =
      error.response?.data?.message || "Failed to create permission";
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editingPermissionId = ref(null);

const emptyEditForm = () => ({
  name: "",
});

const editForm = ref(emptyEditForm());

const openEditModal = (permission) => {
  editingPermissionId.value = permission.id;
  editForm.value = {
    name: permission.name || "",
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

    const response = await axios.put(
      `${apiBase}/permissions/${editingPermissionId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Permission updated successfully");
      closeEditModal();
      await fetchPermissions();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message =
      error.response?.data?.message || "Failed to update permission";
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const deletingId = ref(null);

const deletePermission = async (permission) => {
  if (!window.confirm(`Are you sure you want to delete "${permission.name}"?`))
    return;

  deletingId.value = permission.id;

  try {
    const response = await axios.delete(
      `${apiBase}/permissions/${permission.id}`,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Permission deleted successfully");
      await fetchPermissions();
    }
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to delete permission";
    showNotification("error", message);
  } finally {
    deletingId.value = null;
  }
};

onMounted(fetchPermissions);
</script>

<template>
  <MainLayout>
    <div class="permission-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Permission Manager</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by permission name..."
            @input="onSearchInput"
          />

          <button type="button" class="create-btn" @click="openCreateModal">
            + Create Permission
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="permissions-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Name</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="4" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!getFilteredPermissions(permissions, searchQuery).length">
              <td colspan="4" class="state-cell">No permissions found</td>
            </tr>
            <template v-else>
              <tr
                v-for="(permission, index) in getPaginatedPermissions(
                  getFilteredPermissions(permissions, searchQuery),
                  currentPage
                )"
                :key="permission.id"
              >
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ permission.name }}</td>
                <td>{{ formatDate(permission.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(permission)"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn delete-btn"
                      title="Delete"
                      :disabled="deletingId === permission.id"
                      @click="deletePermission(permission)"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div
          v-if="!loading && getFilteredPermissions(permissions, searchQuery).length"
          class="pagination"
        >
          <button
            type="button"
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Prev
          </button>

          <span class="page-info"
            >Page {{ currentPage }} of
            {{ getTotalPages(getFilteredPermissions(permissions, searchQuery)) }}</span
          >

          <button
            type="button"
            class="page-btn"
            :disabled="
              currentPage ===
              getTotalPages(getFilteredPermissions(permissions, searchQuery))
            "
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create Permission</h2>
            <button type="button" class="form-modal-close" @click="closeCreateModal">
              &times;
            </button>
          </div>

          <form class="create-form" autocomplete="off" @submit.prevent="submitCreate">
            <div class="form-row">
              <label>Name</label>
              <input
                v-model="createForm.name"
                type="text"
                autocomplete="off"
                required
              />
              <span v-if="createErrors.name" class="field-error">{{
                createErrors.name[0]
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
            <h2>Edit Permission</h2>
            <button type="button" class="form-modal-close" @click="closeEditModal">
              &times;
            </button>
          </div>

          <form class="create-form" autocomplete="off" @submit.prevent="submitEdit">
            <div class="form-row">
              <label>Name</label>
              <input
                v-model="editForm.name"
                type="text"
                autocomplete="off"
                required
              />
              <span v-if="editErrors.name" class="field-error">{{
                editErrors.name[0]
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
.permission-page {
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

.search-input {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #2b2e24;
  font-size: 13px;
  outline: none;
  width: 240px;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #285239;
  }
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

.permissions-table {
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

  input {
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
}

.field-error {
  font-size: 12px;
  color: #b3261e;
}

.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 8px;
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

@media (max-width: 640px) {
  .toolbar-right {
    width: 100%;
  }

  .search-input,
  .create-btn {
    width: 100%;
  }

  .form-modal-content {
    padding: 16px;
  }
}
</style>

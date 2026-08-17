<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import { EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase } from "@/utilities/config";
import { showNotification } from "@/utilities/notification";

const loginStore = useLoginStore();

const roles = ref([]);
const permissions = ref([]);
const loading = ref(false);

const fetchRoles = async () => {
  loading.value = true;

  try {
    const response = await axios.get(
      `${apiBase}/roles`,
      loginStore.getTokenConfig
    );

    roles.value = response.data.role || [];
    currentPage.value = 1;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load roles";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const fetchPermissions = async () => {
  try {
    const response = await axios.get(
      `${apiBase}/permission_list`,
      loginStore.getTokenConfig
    );

    permissions.value = response.data.permission || [];
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to load permissions";
    showNotification("error", message);
  }
};

const pageSize = 20;
const currentPage = ref(1);
const searchQuery = ref("");

const getPermissionNames = (role) =>
  role.permissions?.length
    ? role.permissions.map((permission) => permission.name).join(", ")
    : "-";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFilteredRoles = (items, query) => {
  if (!query) return items;
  const term = query.toLowerCase();
  return items.filter((role) => role.name?.toLowerCase().includes(term));
};

const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / pageSize));

const getPaginatedRoles = (items, page) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const goToPage = (page) => {
  const filtered = getFilteredRoles(roles.value, searchQuery.value);
  if (page < 1 || page > getTotalPages(filtered)) return;
  currentPage.value = page;
};

const onSearchInput = () => {
  currentPage.value = 1;
};

const showViewModal = ref(false);
const viewLoading = ref(false);
const viewRole = ref(null);

const openViewModal = async (role) => {
  showViewModal.value = true;
  viewLoading.value = true;
  viewRole.value = null;

  try {
    const response = await axios.get(
      `${apiBase}/roles/${role.id}`,
      loginStore.getTokenConfig
    );

    viewRole.value = response.data.role;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load role details";
    showNotification("error", message);
    showViewModal.value = false;
  } finally {
    viewLoading.value = false;
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewRole.value = null;
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});

const emptyCreateForm = () => ({
  name: "",
  permissions: [],
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
    createForm.value.permissions.forEach((id) => data.append("permission[]", id));

    const response = await axios.post(`${apiBase}/roles`, data, {
      headers: {
        ...loginStore.getTokenConfig.headers,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Role created successfully");
      closeCreateModal();
      await fetchRoles();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to create role";
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editingRoleId = ref(null);

const emptyEditForm = () => ({
  name: "",
  permissions: [],
});

const editForm = ref(emptyEditForm());

const openEditModal = (role) => {
  editingRoleId.value = role.id;
  editForm.value = {
    name: role.name || "",
    permissions: role.permissions?.map((permission) => permission.id) || [],
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
    editForm.value.permissions.forEach((id) => data.append("permission[]", id));

    const response = await axios.put(
      `${apiBase}/roles/${editingRoleId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Role updated successfully");
      closeEditModal();
      await fetchRoles();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to update role";
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const deletingId = ref(null);

const deleteRole = async (role) => {
  if (!window.confirm(`Are you sure you want to delete "${role.name}"?`)) return;

  deletingId.value = role.id;

  try {
    const response = await axios.delete(
      `${apiBase}/roles/${role.id}`,
      loginStore.getTokenConfig
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Role deleted successfully");
      await fetchRoles();
    }
  } catch (error) {
    const message = error.response?.data?.message || "Failed to delete role";
    showNotification("error", message);
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  fetchRoles();
  fetchPermissions();
});
</script>

<template>
  <MainLayout>
    <div class="role-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">Role Manager</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by role name..."
            @input="onSearchInput"
          />

          <button type="button" class="create-btn" @click="openCreateModal">
            + Create Role
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="roles-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Name</th>
              <th>Permissions</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="5" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!getFilteredRoles(roles, searchQuery).length">
              <td colspan="5" class="state-cell">No roles found</td>
            </tr>
            <template v-else>
              <tr
                v-for="(role, index) in getPaginatedRoles(
                  getFilteredRoles(roles, searchQuery),
                  currentPage
                )"
                :key="role.id"
              >
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ role.name }}</td>
                <td>
                  <span class="permission-badge">{{ getPermissionNames(role) }}</span>
                </td>
                <td>{{ formatDate(role.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="action-btn view-btn"
                      title="Show"
                      @click="openViewModal(role)"
                    >
                      <EyeOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(role)"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn delete-btn"
                      title="Delete"
                      :disabled="deletingId === role.id"
                      @click="deleteRole(role)"
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
          v-if="!loading && getFilteredRoles(roles, searchQuery).length"
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
            {{ getTotalPages(getFilteredRoles(roles, searchQuery)) }}</span
          >

          <button
            type="button"
            class="page-btn"
            :disabled="
              currentPage === getTotalPages(getFilteredRoles(roles, searchQuery))
            "
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div v-if="showViewModal" class="form-modal-backdrop" @click="closeViewModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Role Details</h2>
            <button type="button" class="form-modal-close" @click="closeViewModal">
              &times;
            </button>
          </div>

          <div v-if="viewLoading" class="state-cell">Loading...</div>

          <div v-else-if="viewRole" class="view-details">
            <div class="view-row">
              <span class="view-label">Name</span>
              <span class="view-value">{{ viewRole.name }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Permissions</span>
              <span class="view-value">{{ getPermissionNames(viewRole) }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Created At</span>
              <span class="view-value">{{ formatDate(viewRole.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create Role</h2>
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

            <div class="form-row">
              <label>Permissions</label>
              <div class="permission-list">
                <label
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="permission-item"
                >
                  <input
                    v-model="createForm.permissions"
                    type="checkbox"
                    :value="permission.id"
                  />
                  {{ permission.name }}
                </label>
                <span v-if="!permissions.length" class="no-permissions"
                  >No permissions available</span
                >
              </div>
              <span v-if="createErrors.permission" class="field-error">{{
                createErrors.permission[0]
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
            <h2>Edit Role</h2>
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

            <div class="form-row">
              <label>Permissions</label>
              <div class="permission-list">
                <label
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="permission-item"
                >
                  <input
                    v-model="editForm.permissions"
                    type="checkbox"
                    :value="permission.id"
                  />
                  {{ permission.name }}
                </label>
                <span v-if="!permissions.length" class="no-permissions"
                  >No permissions available</span
                >
              </div>
              <span v-if="editErrors.permission" class="field-error">{{
                editErrors.permission[0]
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
.role-page {
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

.roles-table {
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

.permission-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e7f3ea;
  color: #285239;
  font-size: 12px;
  font-weight: 700;
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

  input[type="text"] {
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

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fbfbf7;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: #2b2e24;
  cursor: pointer;

  input[type="checkbox"] {
    width: 15px;
    height: 15px;
    accent-color: #285239;
    cursor: pointer;
  }
}

.no-permissions {
  font-size: 12px;
  color: #a7ab9b;
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

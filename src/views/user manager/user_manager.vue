<script setup>
import { onMounted, ref } from "vue";
import axios from "axios";
import { EyeOutlined, EditOutlined, KeyOutlined } from "@ant-design/icons-vue";

import MainLayout from "@/components/layouts/main_layout.vue";
import { useLoginStore } from "@/stores/login";
import { apiBase } from "@/utilities/config";
import { showNotification } from "@/utilities/notification";

const loginStore = useLoginStore();

const users = ref([]);
const loading = ref(false);

const fetchUsers = async () => {
  loading.value = true;

  try {
    const response = await axios.get(
      `${apiBase}/user_list`,
      loginStore.getTokenConfig
    );

    users.value = response.data.users || [];
    currentPage.value = 1;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load users";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};

const roleOptions = ref([]);

const fetchRoleOptions = async () => {
  try {
    const response = await axios.get(
      `${apiBase}/role_wise_user`,
      loginStore.getTokenConfig
    );

    roleOptions.value = Object.keys(response.data.roles || {});
  } catch (error) {
    const message =
      error.response?.data?.message || "Failed to load role filter options";
    showNotification("error", message);
  }
};

const permissions = ref([]);

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
const roleFilter = ref("");

const getRoleNames = (user) =>
  user.roles?.length ? user.roles.map((role) => role.name).join(", ") : "-";

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getFilteredUsers = (items, query, role) => {
  let result = items;

  if (role) {
    result = result.filter((user) =>
      user.roles?.some((userRole) => userRole.name === role)
    );
  }

  if (query) {
    const term = query.toLowerCase();
    result = result.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term)
    );
  }

  return result;
};

const getTotalPages = (items) => Math.max(1, Math.ceil(items.length / pageSize));

const getPaginatedUsers = (items, page) => {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

const goToPage = (page) => {
  const filtered = getFilteredUsers(users.value, searchQuery.value, roleFilter.value);
  if (page < 1 || page > getTotalPages(filtered)) return;
  currentPage.value = page;
};

const onSearchInput = () => {
  currentPage.value = 1;
};

const onRoleFilterChange = () => {
  currentPage.value = 1;
};

const showViewModal = ref(false);
const viewLoading = ref(false);
const viewUser = ref(null);

const openViewModal = async (user) => {
  showViewModal.value = true;
  viewLoading.value = true;
  viewUser.value = null;

  try {
    const response = await axios.get(
      `${apiBase}/user_show/${user.id}`,
      loginStore.getTokenConfig
    );

    viewUser.value = response.data.result;
  } catch (error) {
    const message = error.response?.data?.message || "Failed to load user details";
    showNotification("error", message);
    showViewModal.value = false;
  } finally {
    viewLoading.value = false;
  }
};

const closeViewModal = () => {
  showViewModal.value = false;
  viewUser.value = null;
};

const showCreateModal = ref(false);
const creating = ref(false);
const createErrors = ref({});

const emptyCreateForm = () => ({
  name: "",
  email: "",
  password: "",
  roles: "admin",
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
    data.append("email", createForm.value.email);
    data.append("password", createForm.value.password);
    data.append("roles", createForm.value.roles);

    const response = await axios.post(`${apiBase}/register`, data, {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "User created successfully");
      closeCreateModal();
      await fetchUsers();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      createErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to create user";
    showNotification("error", message);
  } finally {
    creating.value = false;
  }
};

const showEditModal = ref(false);
const updating = ref(false);
const editErrors = ref({});
const editingUserId = ref(null);

const emptyEditForm = () => ({
  name: "",
  email: "",
  roles: "admin",
});

const editForm = ref(emptyEditForm());

const openEditModal = (user) => {
  editingUserId.value = user.id;
  editForm.value = {
    name: user.name || "",
    email: user.email || "",
    roles: user.roles?.[0]?.name || "admin",
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
    data.append("email", editForm.value.email);
    data.append("roles", editForm.value.roles);

    const response = await axios.put(
      `${apiBase}/user_update/${editingUserId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "User updated successfully");
      closeEditModal();
      await fetchUsers();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      editErrors.value = error.response.data.errors || {};
    }
    const message = error.response?.data?.message || "Failed to update user";
    showNotification("error", message);
  } finally {
    updating.value = false;
  }
};

const showAssignModal = ref(false);
const assigning = ref(false);
const assignErrors = ref({});
const assigningUserId = ref(null);

const emptyAssignForm = () => ({
  permissions: [],
});

const assignForm = ref(emptyAssignForm());

const openAssignModal = (user) => {
  assigningUserId.value = user.id;
  assignForm.value = {
    permissions: user.permissions?.map((permission) => permission.name) || [],
  };
  assignErrors.value = {};
  showAssignModal.value = true;
};

const closeAssignModal = () => {
  showAssignModal.value = false;
};

const submitAssign = async () => {
  assigning.value = true;
  assignErrors.value = {};

  try {
    const data = new URLSearchParams();
    assignForm.value.permissions.forEach((name) =>
      data.append("permissions[]", name)
    );

    const response = await axios.put(
      `${apiBase}/assign_permission/${assigningUserId.value}`,
      data,
      {
        headers: {
          ...loginStore.getTokenConfig.headers,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    if (response?.status >= 200 && response?.status < 300) {
      showNotification("success", "Permissions assigned successfully");
      closeAssignModal();
      await fetchUsers();
    }
  } catch (error) {
    if (error.response?.status === 422) {
      assignErrors.value = error.response.data.errors || {};
    }
    const message =
      error.response?.data?.message || "Failed to assign permissions";
    showNotification("error", message);
  } finally {
    assigning.value = false;
  }
};

onMounted(() => {
  fetchUsers();
  fetchRoleOptions();
  fetchPermissions();
});
</script>

<template>
  <MainLayout>
    <div class="user-page">
      <div class="page-toolbar">
        <div class="toolbar-left">
          <h1 class="page-title">User Manager</h1>
        </div>

        <div class="toolbar-right">
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Search by name or email..."
            @input="onSearchInput"
          />

          <select
            v-model="roleFilter"
            class="role-select"
            @change="onRoleFilterChange"
          >
            <option value="">All Roles</option>
            <option v-for="role in roleOptions" :key="role" :value="role">
              {{ role }}
            </option>
          </select>

          <button type="button" class="create-btn" @click="openCreateModal">
            + Create User
          </button>
        </div>
      </div>

      <div class="table-card">
        <table class="users-table">
          <thead>
            <tr>
              <th>SL</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="state-cell">Loading...</td>
            </tr>
            <tr v-else-if="!getFilteredUsers(users, searchQuery, roleFilter).length">
              <td colspan="6" class="state-cell">No users found</td>
            </tr>
            <template v-else>
              <tr
                v-for="(user, index) in getPaginatedUsers(
                  getFilteredUsers(users, searchQuery, roleFilter),
                  currentPage
                )"
                :key="user.id"
              >
                <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role-badge">{{ getRoleNames(user) }}</span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
                <td>
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="action-btn view-btn"
                      title="Show"
                      @click="openViewModal(user)"
                    >
                      <EyeOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn edit-btn"
                      title="Edit"
                      @click="openEditModal(user)"
                    >
                      <EditOutlined />
                    </button>
                    <button
                      type="button"
                      class="action-btn assign-btn"
                      title="Assign Permission"
                      @click="openAssignModal(user)"
                    >
                      <KeyOutlined />
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <div
          v-if="!loading && getFilteredUsers(users, searchQuery, roleFilter).length"
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
            {{ getTotalPages(getFilteredUsers(users, searchQuery, roleFilter)) }}</span
          >

          <button
            type="button"
            class="page-btn"
            :disabled="
              currentPage === getTotalPages(getFilteredUsers(users, searchQuery, roleFilter))
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
            <h2>User Details</h2>
            <button type="button" class="form-modal-close" @click="closeViewModal">
              &times;
            </button>
          </div>

          <div v-if="viewLoading" class="state-cell">Loading...</div>

          <div v-else-if="viewUser" class="view-details">
            <div class="view-row">
              <span class="view-label">Name</span>
              <span class="view-value">{{ viewUser.name }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Email</span>
              <span class="view-value">{{ viewUser.email }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Email Verified</span>
              <span class="view-value">{{
                viewUser.email_verified_at ? formatDate(viewUser.email_verified_at) : "No"
              }}</span>
            </div>

            <div class="view-row">
              <span class="view-label">Created At</span>
              <span class="view-value">{{ formatDate(viewUser.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCreateModal" class="form-modal-backdrop" @click="closeCreateModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Create User</h2>
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
              <label>Email</label>
              <input
                v-model="createForm.email"
                type="email"
                autocomplete="off"
                required
              />
              <span v-if="createErrors.email" class="field-error">{{
                createErrors.email[0]
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
              <label>Role</label>
              <select v-model="createForm.roles" class="role-select-input" required>
                <option value="" disabled>Select role</option>
                <option v-for="role in roleOptions" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
              <span v-if="createErrors.roles" class="field-error">{{
                createErrors.roles[0]
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
            <h2>Edit User</h2>
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
              <label>Email</label>
              <input
                v-model="editForm.email"
                type="email"
                autocomplete="off"
                required
              />
              <span v-if="editErrors.email" class="field-error">{{
                editErrors.email[0]
              }}</span>
            </div>

            <div class="form-row">
              <label>Role</label>
              <select v-model="editForm.roles" class="role-select-input" required>
                <option value="" disabled>Select role</option>
                <option v-for="role in roleOptions" :key="role" :value="role">
                  {{ role }}
                </option>
              </select>
              <span v-if="editErrors.roles" class="field-error">{{
                editErrors.roles[0]
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

      <div v-if="showAssignModal" class="form-modal-backdrop" @click="closeAssignModal">
        <div class="form-modal-content" @click.stop>
          <div class="form-modal-header">
            <h2>Assign Permission</h2>
            <button type="button" class="form-modal-close" @click="closeAssignModal">
              &times;
            </button>
          </div>

          <form class="create-form" autocomplete="off" @submit.prevent="submitAssign">
            <div class="form-row">
              <label>Permissions</label>
              <div class="permission-list">
                <label
                  v-for="permission in permissions"
                  :key="permission.id"
                  class="permission-item"
                >
                  <input
                    v-model="assignForm.permissions"
                    type="checkbox"
                    :value="permission.name"
                  />
                  {{ permission.name }}
                </label>
                <span v-if="!permissions.length" class="no-permissions"
                  >No permissions available</span
                >
              </div>
              <span v-if="assignErrors.permissions" class="field-error">{{
                assignErrors.permissions[0]
              }}</span>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" @click="closeAssignModal">
                Cancel
              </button>
              <button type="submit" class="submit-btn" :disabled="assigning">
                {{ assigning ? "Saving..." : "Save" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </MainLayout>
</template>

<style scoped lang="scss">
.user-page {
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

.role-select {
  height: 38px;
  padding: 0 14px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #2b2e24;
  font-size: 13px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:focus {
    border-color: #285239;
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

.users-table {
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

.role-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 999px;
  background: #e7f3ea;
  color: #285239;
  font-size: 12px;
  font-weight: 700;
  text-transform: capitalize;
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

  &.assign-btn {
    color: #8a6d1f;

    &:hover {
      background: #fdf3e0;
      border-color: #8a6d1f;
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
  .role-select-input {
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

  .role-select-input {
    cursor: pointer;
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
  .role-select,
  .create-btn {
    width: 100%;
  }

  .form-modal-content {
    padding: 16px;
  }
}
</style>

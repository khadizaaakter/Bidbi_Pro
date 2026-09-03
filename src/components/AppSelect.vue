<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";

const props = defineProps({
  modelValue: { type: [String, Number], default: "" },
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: "Select" },
});

const emit = defineEmits(["update:modelValue", "change"]);

const open = ref(false);
const rootRef = ref(null);

const normalizedOptions = () =>
  props.options.map((opt) => (typeof opt === "string" ? { label: opt, value: opt } : opt));

const getSelectedLabel = () => {
  const match = normalizedOptions().find((opt) => opt.value === props.modelValue);
  return match ? match.label : props.placeholder;
};

const toggleOpen = () => {
  open.value = !open.value;
};

const closeMenu = () => {
  open.value = false;
};

const selectOption = (opt) => {
  emit("update:modelValue", opt.value);
  emit("change", opt.value);
  closeMenu();
};

const handleClickOutside = (event) => {
  if (open.value && rootRef.value && !rootRef.value.contains(event.target)) {
    closeMenu();
  }
};

onMounted(() => document.addEventListener("click", handleClickOutside));
onBeforeUnmount(() => document.removeEventListener("click", handleClickOutside));
</script>

<template>
  <div class="app-select" ref="rootRef">
    <button type="button" class="app-select-trigger" @click="toggleOpen">
      <span class="app-select-value">{{ getSelectedLabel() }}</span>
      <i class="bx bx-chevron-down app-select-caret" :class="{ open }"></i>
    </button>

    <transition name="app-select-fade">
      <div v-if="open" class="app-select-menu">
        <button
          v-for="opt in normalizedOptions()"
          :key="opt.value"
          type="button"
          class="app-select-option"
          :class="{ active: opt.value === modelValue }"
          @click="selectOption(opt)"
        >
          {{ opt.label }}
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped lang="scss">
.app-select {
  position: relative;
}

.app-select-trigger {
  width: 100%;
  height: 38px;
  min-width: 140px;
  padding: 0 12px 0 14px;
  border-radius: 10px;
  border: 1px solid #e7e4d6;
  background: #fff;
  color: #2b2e24;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: #285239;
  }
}

.app-select-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-select-caret {
  font-size: 16px;
  color: #6b7461;
  flex-shrink: 0;
  transition: transform 0.2s ease;

  &.open {
    transform: rotate(180deg);
  }
}

.app-select-menu {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  min-width: 160px;
  max-height: 240px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #e7e4d6;
  border-radius: 10px;
  box-shadow: 0 20px 40px -16px rgba(40, 82, 57, 0.28);
  padding: 6px;
  z-index: 50;
}

.app-select-option {
  display: block;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #2b2e24;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: #f6f7f0;
  }

  &.active {
    background: #e7f3ea;
    color: #285239;
  }
}

.app-select-fade-enter-active,
.app-select-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.app-select-fade-enter-from,
.app-select-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

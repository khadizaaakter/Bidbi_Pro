<template>
  <section class="login-page">
    <div class="login-card">
      <!-- Left: illustration panel -->
      <div class="art-panel">
        <img src="/images/abiofortifie.webp" alt="Bidbi Pro" class="art-image" />
        <div class="art-overlay"></div>
      </div>

      <!-- Right: form panel -->
      <div class="form-panel">
        <p class="eyebrow">Welcome!</p>
        <h1 class="title">Bidbi Pro <span>Login</span></h1>

        <form class="login-form" @submit.prevent="handleLogin">
          <div class="field">
            <label>Email</label>
            <div class="input-wrap">
              <i class="bx bx-envelope"></i>
              <input v-model="email" type="email" placeholder="you@company.com" required />
            </div>
          </div>

          <div class="field">
            <label>Password</label>
            <div class="input-wrap">
              <i class="bx bx-lock-alt"></i>
              <input v-model="password" :type="showPassword ? 'text' : 'password'" placeholder="••••••••"
                required />
              <i class="bx toggle-eye" :class="showPassword ? 'bx-show' : 'bx-hide'"
                @click="showPassword = !showPassword"></i>
            </div>
          </div>
          <button type="submit" class="submit-btn" :disabled="loading">
            <span>{{ loading ? "Logging in..." : "Log In" }}</span>
            <i class="bx bx-right-arrow-alt"></i>
          </button>
        </form>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

import { useLoginStore } from "@/stores/login";
import { showNotification } from "@/utilities/notification";

const router = useRouter();
const loginStore = useLoginStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;

  try {
    const data = await loginStore.login(email.value, password.value);
    showNotification("success", data.message || "Login Success");
    router.push({ name: "home" });
  } catch (error) {
    const message = error.response?.data?.message || "Invalid email or password";
    showNotification("error", message);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background: #f4f2ea;
  padding: 24px;
}

.page-blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.35;
  animation: drift 18s ease-in-out infinite;
}

.blob-1 {
  width: 380px;
  height: 380px;
  top: -140px;
  left: -120px;
  background: radial-gradient(circle, #cdd8ba 0%, transparent 70%);
}

.blob-2 {
  width: 320px;
  height: 320px;
  bottom: -120px;
  right: -100px;
  background: radial-gradient(circle, #e3c9a8 0%, transparent 70%);
  animation-delay: -6s;
}

@keyframes drift {

  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }

  50% {
    transform: translate(24px, -20px) scale(1.06);
  }
}

.page-gear {
  position: absolute;
  bottom: -60px;
  right: -60px;
  font-size: 260px;
  color: #285239;
  opacity: 0.08;
  animation: spin-slow 40s linear infinite;
}

@keyframes spin-slow {
  to {
    transform: rotate(360deg);
  }
}

.login-card {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  max-width: 860px;
  min-height: 500px;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  box-shadow:
    0 30px 70px -20px rgba(61, 70, 54, 0.28),
    0 0 0 1px rgba(61, 70, 54, 0.04);
  animation: card-in 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* ---------- left illustration panel ---------- */
.art-panel {
  position: relative;
  flex: 1 1 46%;
  overflow: hidden;
  background: #16301f;
}

.art-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  animation: img-in 0.9s 0.1s cubic-bezier(0.22, 1, 0.36, 1) backwards, img-zoom 18s ease-in-out infinite alternate;
}

@keyframes img-in {
  from {
    opacity: 0;
    transform: scale(1.06);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes img-zoom {
  from {
    transform: scale(1);
  }

  to {
    transform: scale(1.08);
  }
}

.art-overlay {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 31, 21, 0.1) 0%, rgba(15, 31, 21, 0.15) 45%, rgba(12, 26, 18, 0.55) 100%),
    linear-gradient(120deg, rgba(40, 82, 57, 0.45) 0%, rgba(40, 82, 57, 0) 60%);
}

/* ---------- right form panel ---------- */
.form-panel {
  flex: 1 1 54%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 52px 56px;
}

.eyebrow {
  font-size: 14px;
  font-weight: 600;
  color: #285239;
  margin: 0 0 6px;
  animation: fade-up 0.6s 0.2s backwards;
}

.title {
  font-size: 26px;
  font-weight: 800;
  color: #2b2e24;
  letter-spacing: -0.02em;
  margin: 0 0 30px;
  animation: fade-up 0.6s 0.3s backwards;

  span {
    display: block;
    font-weight: 600;
    font-size: 18px;
    color: #4c6255;
  }
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fade-up 0.6s backwards;

  &:nth-of-type(1) {
    animation-delay: 0.4s;
  }

  &:nth-of-type(2) {
    animation-delay: 0.48s;
  }

  label {
    font-size: 13px;
    font-weight: 600;
    color: #45493d;
  }
}

.input-wrap {
  position: relative;
  display: flex;
  align-items: center;

  i {
    position: absolute;
    left: 16px;
    font-size: 17px;
    color: #285239;
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 48px;
    padding: 0 44px;
    border-radius: 12px;
    border: 1px solid #e7e4d6;
    background: #f6f7f0;
    color: #2b2e24;
    font-size: 14.5px;
    outline: none;
    transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;

    &::placeholder {
      color: #a7ab9b;
    }

    &:focus {
      border-color: #285239;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(40, 82, 57, 0.16);
    }
  }

  .toggle-eye {
    left: auto;
    right: 16px;
    cursor: pointer;
    pointer-events: auto;
    transition: color 0.2s ease;

    &:hover {
      color: #45493d;
    }
  }
}

.form-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  animation: fade-up 0.6s 0.56s backwards;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7461;
  cursor: pointer;
  user-select: none;

  input {
    display: none;
  }

  .checkmark {
    width: 16px;
    height: 16px;
    border-radius: 5px;
    border: 1px solid #d3d0bf;
    display: inline-block;
    position: relative;
    transition: all 0.2s ease;
  }

  input:checked+.checkmark {
    background: #285239;
    border-color: #285239;

    &::after {
      content: '';
      position: absolute;
      left: 5px;
      top: 1px;
      width: 4px;
      height: 8px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      transform: rotate(45deg);
    }
  }
}

.forgot {
  color: #285239;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;

  &:hover {
    color: #1a331f;
  }
}

.submit-btn {
  position: relative;
  height: 48px;
  margin-top: 4px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #285239, #1e3d2a);
  background-size: 200% 200%;
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-position 0.4s ease;
  box-shadow: 0 12px 26px -8px rgba(40, 82, 57, 0.55);
  animation: fade-up 0.6s 0.64s backwards;

  i {
    font-size: 18px;
    transition: transform 0.25s ease;
  }

  &:hover {
    background-position: 100% 0;
    transform: translateY(-2px);
    box-shadow: 0 16px 30px -8px rgba(40, 82, 57, 0.65);

    i {
      transform: translateX(4px);
    }
  }

  &:active {
    transform: translateY(0);
  }
}

@media (max-width: 720px) {
  .login-card {
    flex-direction: column;
    max-width: 420px;
  }

  .art-panel {
    display: none;
  }

  .form-panel {
    padding: 40px 32px;
  }
}
</style>

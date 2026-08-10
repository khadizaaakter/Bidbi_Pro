import { defineStore } from "pinia";
import axios from "axios";

import { apiBase } from "@/utilities/config";

export const useLoginStore = defineStore("loginStore", {
  state: () => ({
    token: null,
    user: null,
  }),

  getters: {
    getTokenConfig: (state) => ({
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${state.token}`,
      },
    }),
  },

  actions: {
    async login(email, password) {
      const data = new URLSearchParams();
      data.append("email", email);
      data.append("password", password);

      const response = await axios.post(`${apiBase}/login`, data, {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      this.token = response.data.token;
      this.user = response.data.user;

      return response.data;
    },

    async logout() {
      try {
        const response = await axios.post(
          `${apiBase}/logout`,
          {},
          this.getTokenConfig
        );

        return response.data;
      } finally {
        this.token = null;
        this.user = null;
      }
    },
  },

  persist: true,
});

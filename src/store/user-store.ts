import { defineStore } from "pinia";
import { userApi, type User } from "../fetch/user";

export const useUserStore = defineStore("user", {
  state: () => ({
    userInfo: null as User | null,
  }),
  getters: {
    isLogin: (state) => !!state.userInfo,
    isAdmin: (state) => state.userInfo?.userRole === "admin"
  },
  actions: {
    updateUserInfo(userInfo: User) {
      this.userInfo = userInfo;
    },
    async logout() {
        await userApi.logout()
        location.reload()
    }
  },
});

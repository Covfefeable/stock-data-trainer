import type { Res } from ".";
import fetchData from ".";

export interface User {
  userName: string;
  userId: string;
  userRole: string;
}

interface LoginQuery {
  userName: string;
  userPassword: string;
}

interface RegisterQuery extends LoginQuery {
  code: string;
}

export const userApi = {
  checkLogin: async (): Promise<Res<User>> =>
    await fetchData("/api/v2/user/login/check", {
      method: "GET",
    }),
  login: async (payload: LoginQuery) =>
    await fetchData("/api/v2/user/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  register: async (payload: RegisterQuery) =>
    await fetchData("/api/v2/user/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  logout: async () =>
    await fetchData("/api/v2/user/logout", {
      method: "GET",
    }),
};

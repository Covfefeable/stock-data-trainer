import { createRouter, createWebHashHistory } from "vue-router";
import { userApi } from "../fetch/user";
import { useUserStore } from "../store/user-store";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: () => import("../pages/login/index"),
  },
  {
    path: "/overview",
    name: "Overview",
    component: () => import("../pages/overview/index"),
  },
  {
    path: "/train-list",
    name: "TrainList",
    component: () => import("../pages/train/index"),
  },
  {
    path: "/factor-list",
    name: "FactorList",
    component: () => import("../pages/factor/index"),
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, _from, next) => {
  if (to.path === '/login') {
    next();
    return;
  }
  const res = await userApi.checkLogin();
  if (res.code === 200) {
    const userStore = useUserStore()
    userStore.updateUserInfo(res.data)
    next();
  } else {
    next('/login');
  }
});

export default router;

export default [
  {
    path: "/userSettings/statistics",
    name: "sUserSetting",
    component: () => import('./UserSettingView.vue'),
    meta: { requiresAuth: true },
  },
];

import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/visualizations',
      name: 'visualizations',
      component: () => import('../views/VisualizationsView.vue')
    },
    {
      path: '/visualizations/softheap',
      name: 'softheap',
      component: () => import('../views/SoftHeapView.vue')
    }
  ]
});

export default router;

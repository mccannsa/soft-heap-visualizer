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
    },
    {
      path: '/visualizations/softheap/percentiles',
      name: 'soft-heap-percentiles',
      component: () => import('../views/SHPercentilesView.vue')
    },
    {
      path: '/visualizations/softheap/median',
      name: 'soft-heap-median',
      component: () => import('../views/SHMedianView.vue')
    },
    {
      path: '/visualizations/softheap/sorting',
      name: 'soft-heap-sorting',
      component: () => import('../views/SHSortingView.vue')
    }
  ]
});

export default router;

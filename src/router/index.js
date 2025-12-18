import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/components',
    name: 'Components',
    component: () => import('@/views/Components.vue'),
  },
  {
    path: '/kb',
    name: 'KB',
    component: () => import('@/views/kb/kb.vue'),
    children: [
      {
        path: 'view',
        name: 'KBView',
        component: () => import('@/views/kb/children/view.vue')
      },
      {
        path: 'edit',
        name: 'KBEdit',
        component: () => import('@/views/kb/children/edit.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

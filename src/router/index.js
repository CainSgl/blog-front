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
    path: '/p',
    name: 'Post',
    component: () => import('@/views/post/post.vue'),
  },
  {
        path: '/space/:id',
        name: 'User',
        component: () => import('@/views/user/user.vue'),
        children: [
          {
            path: '',
            name: 'UserHome',
            component: () => import('@/views/user/children/home/Home.vue'),
            children: [
              {
                path: '',
                name: 'UserHomeIndex',
                component: () => import('@/views/user/children/home/children/index.vue')
              },
              {
                path: 'followers',
                name: 'UserFollowers',
                component: () => import('@/views/user/children/home/children/Followers.vue')
              },
              {
                path: 'following',
                name: 'UserFollowing',
                component: () => import('@/views/user/children/home/children/Following.vue')
              },
            ]
          },
          {
            path: 'knowledge',
            name: 'UserKnowledge',
            component: () => import('@/views/user/children/Knowledge.vue')
          },
          {
            path: 'docs',
            name: 'UserDocs',
            component: () => import('@/views/user/children/Docs.vue')
          },
          {
            path: 'cloud',
            name: 'UserCloud',
            component: () => import('@/views/user/children/Cloud.vue')
          }
        ]
  },
  {
    path: '/kb',
    name: 'KB',
    component: () => import('@/views/kb/kb.vue'),
    children: [
        {
        path: '',
        name: 'KBIndex',
        component: () => import('@/views/kb/children/index.vue')
      },
       {
        path: 'settings',
        name: 'KBIndexEdit',
        component: () => import('@/views/kb/children/editIndex.vue')
      },
      {
        path: 'view',
        name: 'KBView',
        component: () => import('@/views/kb/children/view.vue')
      },
      {
        path: 'edit',
        name: 'KBEdit',
        component: () => import('@/views/kb/children/edit.vue')
      },
      {
        path: 'no',
        name: 'NoPermission',
        component: () => import('@/views/kb/children/NoPermission.vue')
      }
    ]
  },
  {
    path: '/commit',
    name: 'ArticleCommit',
    component: () => import('@/views/ArticleCommit.vue'),
  },
  {
    path: '/redirect',
    name: 'Redirect',
    component: () => import('@/views/RedirectPage.vue'),
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

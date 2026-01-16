import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/views/Blog.vue'),
  },
  {
    path: '/components',
    name: 'Components',
    component: () => import('@/views/misc/Components.vue'),
  },
  {
    path: '/p/:id',
    name: 'Post',
    component: () => import('@/views/post/post.vue'),
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/search/Search.vue'),
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/about/About.vue'),
  },
  {
    path: '/space',
    name: 'SpaceRedirect',
    beforeEnter: async (to, from, next) => 
    {
      // 导入用户store来获取当前用户信息
      const { useUserStore } = await import('@/store/user.js');
      const userStore = useUserStore();
      
      // 尝试获取用户信息
      try 
      {
        const userInfo = await userStore.getUserInfo();
        if(userInfo.id=='-1')
        {
          //必须登录才行，直接跳转到登录页
          const { showLoginModal } = await import('@/services/authService' );
          showLoginModal(false);
          return;
        }
        if (userInfo && userInfo.id) 
        {
          next(`/space/${userInfo.id}`);
        }
        else 
        {
          next('/404');
        }
      }
      catch (error) 
      {
        next('/404');
      }
    }
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
            component: () =>
              import('@/views/user/children/home/children/index.vue'),
          },
          {
            path: 'followers',
            name: 'UserFollowers',
            component: () =>
              import('@/views/user/children/home/children/Followers.vue'),
          },
          {
            path: 'following',
            name: 'UserFollowing',
            component: () =>
              import('@/views/user/children/home/children/Following.vue'),
          },
        ],
      },
      {
        path: 'knowledge',
        name: 'UserKnowledge',
        component: () => import('@/views/user/children/Knowledge.vue'),
      },
      {
        path: 'docs',
        name: 'UserDocs',
        component: () => import('@/views/user/children/Docs.vue'),
      },
      {
        path: 'cloud',
        name: 'UserCloud',
        component: () => import('@/views/user/children/Cloud.vue'),
      },
    ],
  },
  {
    path: '/kb',
    name: 'KB',
    component: () => import('@/views/kb/kb.vue'),
    children: [
      {
        path: '',
        name: 'KBIndex',
        component: () => import('@/views/kb/children/index/index.vue'),
      },
      {
        path: 'settings',
        name: 'KBIndexEdit',
        component: () => import('@/views/kb/children/index/editIndex.vue'),
      },
      {
        path: 'view',
        name: 'KBView',
        component: () => import('@/views/kb/children/view.vue'),
      },
      {
        path: 'edit',
        name: 'KBEdit',
        component: () => import('@/views/kb/children/edit.vue'),
      },
      {
        path: 'no',
        name: 'NoPermission',
        component: () => import('@/views/kb/children/NoPermission.vue'),
      },
    ],
  },
  {
    path: '/kb/create',
    name: 'KBCreate',
    component: () => import('@/views/kb/children/create.vue'),
  },
  {
    path: '/commit',
    name: 'ArticleCommit',
    component: () => import('@/views/post/ArticleCommit.vue'),
  },
  {
    path: '/redirect',
    name: 'Redirect',
    component: () => import('@/views/misc/RedirectPage.vue'),
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/misc/NotFound.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

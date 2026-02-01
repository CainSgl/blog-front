import { createRouter, createWebHistory } from 'vue-router';
import { useUserStore } from '@/store/user.js';
import { showLoginModal } from '@/services/authService';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/home/Home.vue'),
    meta: { title: 'cainsgl的小破站，交个朋友吧！(,,・ω・,,)' }
  },
  {
    path: '/blog',
    name: 'Blog',
    component: () => import('@/views/Blog.vue'),
    meta: { title: 'cainsgl小站的博客_(:3 ⌒ﾞ)_' }
  },
  {
    path: '/knowledge',
    name: 'Knowledge',
    component: () => import('@/views/Knowledge.vue'),
    meta: { title: '都是一些知识库呢' }
  },
  {
    path: '/p/:id',
    name: 'Post',
    component: () => import('@/views/post/post.vue'),
    meta: { title: '加载中' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('@/views/search/Search.vue'),
    meta: { title: '全力搜索中' }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@/views/about/About.vue'),
    meta: { title: '关于我们' }
  },
  {
    path: '/about/view/:id',
    name: 'AboutArticle',
    component: () => import('@/views/about/About.vue'),
  },
  {
    path: '/about/dir/:id',
    name: 'AboutDir',
    component: () => import('@/views/about/About.vue'),
  },
  {
    path: '/announcement/:id',
    name: 'Announcement',
    component: () => import('@/views/announcement/Announcement.vue'),
    meta: { title: '公告' }
  },
  {
    path: '/space',
    name: 'SpaceRedirect',
    beforeEnter: async (to, from, next) => {
      // 导入用户store来获取当前用户信息
      const userStore = useUserStore();

      // 尝试获取用户信息
      try {
        const userInfo = await userStore.getUserInfo();
        if (userInfo.id == '-1') {
          //必须登录才行，直接跳转到登录页
          showLoginModal(false);
          return;
        }
        if (userInfo && userInfo.id) {
          next(`/space/${userInfo.id}`);
        }
        else {
          next('/404');
        }
      }
      catch (error) {
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
        component: () => import('@/views/user/children/kb/Knowledge.vue'),
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
      {
        path: 'favorites',
        name: 'UserFavorite',
        component: () => import('@/views/user/children/favorite/Favorite.vue'),
      },
      {
        path: 'history',
        name: 'UserHistory',
        component: () => import('@/views/user/children/History.vue'),
      },
    ],
  },
  {
    path: '/kb',
    name: 'KB',
    component: () => import('@/views/kb/kb.vue'),
    meta: { title: '知识库' },
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
        meta: { title: '你似乎没有权限访问呢，如果这是个异常请联系管理员' }
      },
    ],
  },
  {
    path: '/kb/create',
    name: 'KBCreate',
    component: () => import('@/views/kb/children/create.vue'),
    meta: { title: '创建知识库' }
  },
  {
    path: '/commit',
    name: 'ArticleCommit',
    component: () => import('@/views/post/ArticleCommit.vue'),
    meta: { title: '发布文章' }
  },
  {
    path: '/messages',
    name: 'Messages',
    component: () => import('@/views/messages/Messages.vue'),
    meta: { title: '消息中心' },
    children: [
      {
        path: 'reply',
        name: 'MessagesReply',
        component: () => import('@/views/messages/children/Reply.vue'),
        meta: { title: '回复我的' }
      },
      {
        path: 'like',
        name: 'MessagesLike',
        component: () => import('@/views/messages/children/Like.vue'),
        meta: { title: '收到的赞' }
      },
      {
        path: 'message',
        name: 'MessagesMessage',
        component: () => import('@/views/messages/children/Message.vue'),
        meta: { title: '系统消息' }
      },
      {
        path: 'report',
        name: 'MessagesReport',
        component: () => import('@/views/messages/children/Report.vue'),
        meta: { title: '举报通知' }
      },
    ],
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { title: '注册账号 - 加入我们' }
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
    meta: { title: '页面走丢了(｡•́︿•̀｡)' }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 全局路由守卫：更新页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title;
  }
  next();
});

export default router;

import { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    { path: '/:pathMatch(.*)*', component: () => import("@renderer/views/404.vue") },
    {
        path: '/', name: '首页', component: () => import('@renderer/views/main/connectors.vue'),
        children: [
            {
                name: "Chat",
                path: "/home/chat",
                component: () => import("@renderer/views/main/chats.vue"),
            },
            {
                name: "Friend",
                path: "/home/friend",
                component: () => import("@renderer/views/main/friends.vue"),
            },
            {
                name: "GROUP",
                path: "/home/group",
                component: () => import("@renderer/views/main/group.vue"),
            }
        ]
    },
    { path: '/login', name: '登录', component: () => import('@renderer/views/login.vue') },
]

export default routes
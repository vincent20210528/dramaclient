import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import { usePermissStore } from '../store/permiss'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { isTokenValid, clearUserData } from '../utils'
import { getBasicPaths, isDynamicRoute } from '../config/routes'

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        name: 'Empty',
        meta: {
            title: '检测登录状态',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "empty" */ '../views/pages/empty.vue'),
    },
    {
        path: '/home',
        name: 'home',
        component: () => import(/* webpackChunkName: "home" */ '../views/home.vue'),
        children: [
            // {
            //     path: '/welcome',
            //     name: 'welcome',
            //     meta: {
            //         title: '首页',
            //         permiss: '1',
            //     },
            //     component: () => import(/* webpackChunkName: "welcome" */ '../views/welcome.vue'),
            // },
            {
                path: '/dashboard',
                name: 'dashboard',
                meta: {
                    title: '统计概览',
                    permiss: '2',
                },
                component: () =>
                    import(/* webpackChunkName: "dashboard" */ '../views/dashboard/index.vue'),
            },
            {
                path: '/app/registerManagement',
                name: 'appRegisterManagement',
                meta: {
                    title: '注册管理',
                    permiss: '9',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appRegister" */ '../views/app/registerManagement/index.vue'
                    ),
            },
            {
                path: '/app/feeManagement',
                name: 'appFeeManagement',
                meta: {
                    title: '年费管理',
                    permiss: '9',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appFee" */ '../views/app/feeManagement/index.vue'
                    ),
            },
            {
                path: '/app/serviceConfig',
                name: 'appServiceConfig',
                meta: {
                    title: '服务配置',
                    permiss: '9',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appServiceConfig" */ '../views/app/serviceConfig/index.vue'
                    ),
            },
            {
                path: '/app/trafficManagement',
                name: 'appTrafficManagement',
                meta: {
                    title: '流量管理',
                    permiss: '9',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appTrafficDetail" */ '../views/app/trafficManagement/detail.vue'
                    ),
            },
            {
                path: '/app/trafficManagement/detail',
                name: 'appTrafficDetail',
                meta: {
                    title: '流量详情',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appTrafficDetail" */ '../views/app/trafficManagement/detail.vue'
                    ),
            },
            {
                // 原“流量管理列表/配置页”保留为独立路由（不挂菜单）
                path: '/app/trafficManagement/config',
                name: 'appTrafficConfig',
                meta: {
                    title: '流量配置',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "appTraffic" */ '../views/app/trafficManagement/index.vue'
                    ),
            },
            {
                path: '/domain/management',
                name: 'domainManagement',
                meta: {
                    title: '域名管理',
                    permiss: '9',
                },
                component: () => import('../views/domain/management/index.vue'),
            },
            {
                path: '/game/categoryConfig',
                name: 'gameCategoryConfig',
                meta: {
                    title: '游戏分类配置',
                    permiss: '11',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "gameCategoryConfig" */ '../views/game/categoryConfig/index.vue'
                    ),
            },
            {
                path: '/game/resourceManagement',
                name: 'gameResourceManagement',
                meta: {
                    title: '游戏资源管理',
                    permiss: '11',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "gameResourceManagement" */ '../views/game/resourceManagement/index.vue'
                    ),
            },
            {
                path: '/game/adPlacement',
                name: 'gameAdPlacement',
                meta: {
                    title: '游戏广告位管理',
                    permiss: '11',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "gameAdPlacement" */ '../views/game/adPlacement/index.vue'
                    ),
            },
            {
                path: '/game/directAd',
                name: 'gameDirectAd',
                meta: {
                    title: '直客广告',
                    permiss: '11',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "gameDirectAd" */ '../views/game/directAd/index.vue'
                    ),
            },
            {
                path: '/system/userManagement',
                name: 'userManagement',
                meta: {
                    title: '用户管理',
                    permiss: '3',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "userManagement" */ '../views/system/userManagement/index.vue'
                    ),
            },
            {
                path: '/system/userManagement/detail',
                name: 'userManagementDetail',
                meta: {
                    title: '用户详情',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "userManagement" */ '../views/system/userManagement/detail.vue'
                    ),
            },
            {
                path: '/system/userManagement/add',
                name: 'userManagementAdd',
                meta: {
                    title: '添加成员',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "userManagement" */ '../views/system/userManagement/add.vue'
                    ),
            },
            {
                path: '/system/roleManagement',
                name: 'roleManagement',
                meta: {
                    title: '角色管理',
                    permiss: '3',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "roleManagement" */ '../views/system/roleManagement/index.vue'
                    ),
            },
            {
                path: '/system/menuManagement',
                name: 'menuManagement',
                meta: {
                    title: '菜单管理',
                    permiss: '3',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "menuManagement" */ '../views/system/menuManagement/index.vue'
                    ),
            },
            {
                path: '/system/developerManagement',
                name: 'developerManagement',
                meta: {
                    title: '开发者管理',
                    permiss: '3',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "developerManagement" */ '../views/system/developerManagement/index.vue'
                    ),
            },
            {
                path: '/system/developerManagement/trafficDetails',
                name: 'developerTrafficDetails',
                meta: {
                    title: '流量包详情',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "developerManagement" */ '../views/system/developerManagement/trafficDetails.vue'
                    ),
            },
            {
                path: '/drama/languageDict',
                name: 'dramaLanguageDict',
                meta: {
                    title: '语言字典',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaLanguageDict" */ '../views/drama/languageDict/index.vue'
                    ),
            },
            {
                path: '/drama/categoryManagement',
                name: 'dramaCategoryManagement',
                meta: {
                    title: '类型标签',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaCategory" */ '../views/drama/categoryManagement/index.vue'
                    ),
            },
            {
                path: '/drama/plotTag',
                name: 'dramaPlotTag',
                meta: {
                    title: '情节标签',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaCategory" */ '../views/drama/plotTag/index.vue'
                    ),
            },
            {
                path: '/drama/copyrightManagement',
                name: 'dramaCopyrightManagement',
                meta: {
                    title: '版权管理',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaCategory" */ '../views/drama/copyrightManagement/index.vue'
                    ),
            },
            {
                path: '/drama/contentManagement',
                name: 'dramaContentManagement',
                meta: {
                    title: '内容列表',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaContentManagement" */ '../views/drama/contentManagement/index.vue'
                    ),
            },
            {
                path: '/drama/contentConfig',
                name: 'dramaContentConfig',
                meta: {
                    title: '内容配置',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaContentConfig" */ '../views/drama/contentConfig/index.vue'
                    ),
            },
            {
                path: '/drama/playStatistics',
                name: 'dramaPlayStatistics',
                meta: {
                    title: '播放统计',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaPlayStatistics" */ '../views/drama/playStatistics/index.vue'
                    ),
            },
            {
                path: '/drama/userAnalysis',
                name: 'dramaUserAnalysis',
                meta: {
                    title: '用户分析',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaUserAnalysis" */ '../views/drama/userAnalysis/index.vue'
                    ),
            },
            {
                path: '/drama/playStatistics/detail/:vid',
                name: 'dramaPlayStatisticsDetail',
                meta: {
                    title: '播放统计详情',
                    permiss: '10',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaPlayStatisticsDetail" */ '../views/drama/playStatistics/detail.vue'
                    ),
            },
            {
                path: '/drama/videoManagement',
                name: 'dramaVideoManagement',
                meta: {
                    title: '视频管理',
                    permiss: '10',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaVideoManagement" */ '../views/drama/videoManagement/index.vue'
                    ),
            },
            {
                path: '/drama/contentManagement/episodes/:id/:page?',
                name: 'dramaContentEpisodes',
                meta: {
                    title: '剧集管理',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaContentEpisodes" */ '../views/drama/contentManagement/episodes.vue'
                    ),
            },
            /**运营管理 */
            {
                path: '/operation/dramaManagement',
                name: 'operationDramaManagement',
                meta: {
                    title: '内容列表',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "operationAccountInfo" */ '../views/operation/dramaManagement/index.vue'
                    ),
            },
            {
                path: '/operation/dramaManagement/episodes/:id/:page?',
                name: 'operationDramaContentEpisodes',
                meta: {
                    title: '剧集管理',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaContentEpisodes" */ '../views/operation/dramaManagement/episodes.vue'
                    ),
            },         
            {
                path: '/operation/trafficManagement',
                name: 'operationTrafficManagement',
                meta: {
                    title: '流量管理',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "operationAccountInfo" */ '../views/operation/trafficManagement/index.vue'
                    ),
            },
             {
                path: '/operation/trafficPacketManagement',
                name: 'operationTrafficPacketManagement',
                meta: {
                    title: '流量包管理',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "operationAccountInfo" */ '../views/operation/trafficPacketManagement/index.vue'
                    ),
            },
             {
                path: '/operation/accountInfo',
                name: 'operationAccountInfo',
                meta: {
                    title: '账户信息',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "operationAccountInfo" */ '../views/operation/accountInfo/index.vue'
                    ),
            },
            {
                path: '/operation/playStatistics',
                name: 'operationPlayStatistics',
                meta: {
                    title: '播放统计',
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaPlayStatistics" */ '../views/drama/playStatistics/index.vue'
                    ),
            },
            {
                path: '/operation/playStatistics/detail/:vid',
                name: 'operationPlayStatisticsDetail',
                meta: {
                    title: '播放统计详情',
                    noTab: true,
                },
                component: () =>
                    import(
                        /* webpackChunkName: "dramaPlayStatisticsDetail" */ '../views/drama/playStatistics/detail.vue'
                    ),
            },
            {
                path: '/ucenter',
                name: 'ucenter',
                meta: {
                    title: '个人中心',
                },
                component: () =>
                    import(/* webpackChunkName: "ucenter" */ '../views/pages/ucenter.vue'),
            },
            {
                path: '/messageCenter',
                name: 'messageCenter',
                meta: {
                    title: '消息中心',
                    noTab: true, // 不添加到标签页
                },
                component: () =>
                    import(
                        /* webpackChunkName: "messageCenter" */ '../views/messageCenter/index.vue'
                    ),
            },
        ],
    },
    {
        path: '/login',
        meta: {
            title: '登录',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "login" */ '../views/pages/login.vue'),
    },
    {
        path: '/register',
        meta: {
            title: '注册',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "register" */ '../views/pages/register.vue'),
    },
    {
        path: '/reset-pwd',
        meta: {
            title: '重置密码',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "reset-pwd" */ '../views/pages/reset-pwd.vue'),
    },
    {
        path: '/403',
        meta: {
            title: '没有权限',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "403" */ '../views/pages/403.vue'),
    },
    {
        path: '/404',
        meta: {
            title: '找不到页面',
            noAuth: true,
        },
        component: () => import(/* webpackChunkName: "404" */ '../views/pages/404.vue'),
    },
    {
        path: '/authenticating',
        name: 'authenticating',
        meta: {
            title: '认证中',
            noAuth: true,
        },
        component: () =>
            import(
                /* webpackChunkName: "authenticating" */ '../views/pages/appH5/authenticating.vue'
            ),
    },
    { path: '/:path(.*)', redirect: '/404' },
]

const router = createRouter({
    history: createWebHashHistory(),
    routes,
})

router.beforeEach(async (to, from, next) => {
    NProgress.start()

    // 如果是免权限页面（如登录页、空页面），直接放行
    if (to.meta.noAuth === true) {
        next()
        return
    }

    // 检查token是否有效
    if (!isTokenValid()) {
        clearUserData()
        next('/login')
        return
    }

    // const permiss = usePermissStore()

    try {
        // // 如果还没有获取过菜单权限，先获取一次
        // if (permiss.allowedPaths.length === 0) {
        //     await permiss.fetchMenuPermissions()
        // }

        // 首先检查是否是基本路径，这些路径所有用户都应该能访问
        const basicPaths = getBasicPaths()
        if (basicPaths.includes(to.path)) {
            next()
            return
        }

        // 检查是否是动态路由（如邀请页面）
        if (isDynamicRoute(to.path)) {
            next()
            return
        }

        // // 检查用户是否有访问该路径的权限
        // if (!permiss.hasPermission(to.path)) {
        //     // 如果没有权限，则进入403
        //     next('/403')
        // } else {
        next()
        // }
    } catch (error) {
        // 如果权限检查失败，但token有效，允许访问基本页面
        if (isTokenValid()) {
            console.log('路由守卫: 权限检查失败但token有效，允许访问基本页面')
            const basicPaths = getBasicPaths()
            if (basicPaths.includes(to.path)) {
                next()
            } else {
                next('/403')
            }
        } else {
            // 如果token也无效，清除用户数据并跳转到登录页
            clearUserData()
            next('/login')
        }
    }
})

router.afterEach(() => {
    NProgress.done()
})

export default router

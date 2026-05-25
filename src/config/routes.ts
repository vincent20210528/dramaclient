// 路由配置文件

// 免权限路由列表（这些路由不需要权限验证，且可以在菜单中显示）
export const NO_AUTH_ROUTES = [
    '/login',                    // 登录页
    '/register',                 // 注册页
    '/reset-pwd',                // 重置密码页
    '/403',                      // 403页面
    '/404',                      // 404页面
    '/'                          // 检测登录状态页面
];

// 基本路径列表（这些路径所有用户都应该能访问）
export const BASIC_PATHS = [
    '/welcome',  // 首页
    '/ucenter',  // 个人中心
    '/messageCenter',  // 消息中心
    '/',         // 检测登录状态页面
];

// 动态路由模式匹配（用于检查路径是否匹配动态路由）
export const DYNAMIC_ROUTE_PATTERNS: RegExp[] = [];

// 检查路径是否为免权限路由
export function isNoAuthRoute(path: string): boolean {
    return NO_AUTH_ROUTES.includes(path);
}

// 检查路径是否为基本路径
export function isBasicPath(path: string): boolean {
    return BASIC_PATHS.includes(path);
}

// 检查路径是否匹配动态路由模式
export function isDynamicRoute(path: string): boolean {
    return DYNAMIC_ROUTE_PATTERNS.some(pattern => pattern.test(path));
}

// 获取所有免权限路由
export function getNoAuthRoutes(): string[] {
    return [...NO_AUTH_ROUTES];
}

// 获取所有基本路径
export function getBasicPaths(): string[] {
    return [...BASIC_PATHS];
}

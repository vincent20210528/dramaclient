import { defineStore } from 'pinia';
import type { MenuItem } from '../types/menu';
import { getBasicPaths } from '../config/routes';
import { menuData } from '../components/menu';
import type { Menus } from '../types/menu';
import { getUserInfo } from '../utils';

export const usePermissStore = defineStore('permiss', {
    state: () => {
        return {
            // 菜单权限路径列表（从 menu.ts 提取）
            allowedPaths: [] as string[],
            // 完整的菜单数据（从 menu.ts 转换）
            menuData: [] as MenuItem[],
            // 是否正在获取权限数据
            isFetching: false,
        };
    },
    actions: {
        // 从 menu.ts 获取菜单权限
        async fetchMenuPermissions() {
            // 如果正在获取，直接返回
            if (this.isFetching) {
                return;
            }
            
            try {
                this.isFetching = true;
                // 优先从登录态中的 perms 同步可访问路径（与菜单展示一致）
                const userInfo = getUserInfo();
                if (userInfo?.perms && Array.isArray(userInfo.perms)) {
                    this.setAllowedPathsFromPerms(userInfo.perms);
                } else {
                    // 无 perms 时使用 menu.ts 全量路径
                    const menus = menuData as Menus[];
                    this.allowedPaths = this.extractPathsFromMenuData(menus);
                    this.ensureBasicPermissions();
                }
                const menus = menuData as Menus[];
                this.menuData = this.convertMenusToMenuItems(menus);
            } catch (error) {
                console.error('获取菜单权限失败:', error);
                // 如果出错，设置默认权限
                this.setDefaultPermissions();
            } finally {
                this.isFetching = false;
            }
        },
        
        // 将 Menus 格式转换为 MenuItem 格式
        convertMenusToMenuItems(menus: Menus[]): MenuItem[] {
            return menus.map(menu => {
                const menuItem: MenuItem = {
                    name: menu.id,
                    path: menu.index.startsWith('/') ? menu.index : `/${menu.index}`,
                    meta: {
                        title: menu.title,
                        icon: menu.icon,
                    },
                };
                
                if (menu.children && menu.children.length > 0) {
                    menuItem.children = this.convertMenusToMenuItems(menu.children);
                }
                
                return menuItem;
            });
        },
        
        // 从 Menus 格式中提取路径
        extractPathsFromMenuData(menus: Menus[]): string[] {
            const paths: string[] = [];
            
            const extractPaths = (items: Menus[]) => {
                items.forEach(item => {
                    if (item.index && item.index.startsWith('/')) {
                        paths.push(item.index);
                    }
                    if (item.children && item.children.length > 0) {
                        extractPaths(item.children);
                    }
                });
            };
            
            extractPaths(menus);
            return paths;
        },
        
        // 设置默认权限（当API调用失败时使用）
        setDefaultPermissions() {
            // 设置默认的允许访问路径 - 权限获取失败的用户只能看到welcome页面
            this.allowedPaths = [
                '/welcome'
            ];
            this.menuData = [];
        },
        
        // 确保基本路径始终在权限列表中
        ensureBasicPermissions() {
            const basicPaths = getBasicPaths();
            basicPaths.forEach(path => {
                if (!this.allowedPaths.includes(path)) {
                    this.allowedPaths.push(path);
                }
            });
        },
        
        // 从菜单数据中提取所有路径（保留用于兼容性）
        extractPathsFromMenu(menuItems: MenuItem[]): string[] {
            const paths: string[] = [];
            
            const extractPaths = (items: MenuItem[]) => {
                items.forEach(item => {
                    if (item.path && !item.hidden) {
                        paths.push(item.path);
                    }
                    if (item.children && item.children.length > 0) {
                        extractPaths(item.children);
                    }
                });
            };
            
            extractPaths(menuItems);
            return paths;
        },
        
        // 智能路径匹配函数
        isPathMatch(permissionPath: string, requestPath: string): boolean {
            // 移除查询参数和哈希
            const cleanRequestPath = requestPath.split('?')[0].split('#')[0];
            const cleanPermissionPath = permissionPath.split('?')[0].split('#')[0];
            
            // 完全匹配
            if (cleanPermissionPath === cleanRequestPath) {
                return true;
            }
            
            // 处理路径参数匹配
            // 例如：/project/channel-add/:id 应该匹配 /project/channel-add/123
            const permissionParts = cleanPermissionPath.split('/');
            const requestParts = cleanRequestPath.split('/');
            
            if (permissionParts.length === requestParts.length) {
                for (let i = 0; i < permissionParts.length; i++) {
                    const permissionPart = permissionParts[i];
                    const requestPart = requestParts[i];
                    
                    // 如果是动态参数（以:开头），则跳过检查
                    if (permissionPart.startsWith(':')) {
                        continue;
                    }
                    
                    // 如果静态部分不匹配，则整个路径不匹配
                    if (permissionPart !== requestPart) {
                        return false;
                    }
                }
                return true;
            }
            
            // 特殊处理：如果权限路径包含动态参数，但请求路径是静态的
            // 例如：权限路径是 /project/channel-add/:id，请求路径是 /project/channel-add
            if (cleanPermissionPath.includes('/:') && !cleanRequestPath.includes('/:')) {
                const basePermissionPath = cleanPermissionPath.replace(/\/:[^/]+$/, '');
                if (cleanRequestPath === basePermissionPath) {
                    return true;
                }
            }
            
            return false;
        },
        
        // 检查用户是否有访问某个路径的权限
        hasPermission(path: string): boolean {
            // 首先检查是否是基本路径，这些路径所有用户都应该能访问
            const basicPaths = getBasicPaths();
            if (basicPaths.includes(path)) {
                return true;
            }
            
            // 特殊处理项目相关路径的权限检查
            // 如果用户有项目列表权限，则允许访问所有项目相关页面
            const projectPaths = [
                '/project/list',
                '/project/add',
                '/project/edit',
                '/project/view',
                '/project/channels',
                '/project/channel-add',
                '/project/channel-add/:id',  // 动态路由模板
                '/project/channel-edit',
                '/project/channel-view'
            ];
            
            
            // 检查是否是项目相关路径
            const isProjectPath = projectPaths.some(projectPath => {
                // 移除查询参数和路径参数进行比较
                const cleanPath = path.split('?')[0].split('#')[0];
                const cleanProjectPath = projectPath.split('?')[0].split('#')[0];
                
                // 完全匹配
                if (cleanPath === cleanProjectPath) {
                    return true;
                }
                
                // 处理动态路由参数匹配
                // 例如：/project/channel-add/123 应该匹配 /project/channel-add/:id
                if (cleanProjectPath.includes('/:') || cleanPath.includes('/')) {
                    // 将路径分割成部分
                    const projectParts = cleanProjectPath.split('/');
                    const pathParts = cleanPath.split('/');
                    
                    // 如果部分数量相同，进行逐部分匹配
                    if (projectParts.length === pathParts.length) {
                        for (let i = 0; i < projectParts.length; i++) {
                            const projectPart = projectParts[i];
                            const pathPart = pathParts[i];
                            
                            // 如果是动态参数（以:开头），则跳过检查
                            if (projectPart.startsWith(':')) {
                                continue;
                            }
                            
                            // 如果静态部分不匹配，则整个路径不匹配
                            if (projectPart !== pathPart) {
                                return false;
                            }
                        }
                        return true;
                    }
                }
                
                // 特殊处理：如果权限路径包含动态参数，但请求路径是静态的
                // 例如：权限路径是 /project/channel-add/:id，请求路径是 /project/channel-add
                if (cleanProjectPath.includes('/:') && !cleanPath.includes('/:')) {
                    const baseProjectPath = cleanProjectPath.replace(/\/:[^/]+$/, '');
                    if (cleanPath === baseProjectPath) {
                        return true;
                    }
                }
                
                return false;
            });
            
            if (isProjectPath) {
                // 检查用户是否有项目相关权限（permiss: '61'）
                const hasProjectPermission = this.allowedPaths.some(allowedPath => {
                    // 检查是否有项目列表权限或其他项目相关权限
                    return allowedPath === '/project/list' || 
                           allowedPath === '/project' ||
                           this.isPathMatch(allowedPath, '/project/list');
                });
                
                if (hasProjectPermission) {
                    console.log('项目路径权限检查通过:', {
                        path,
                        isProjectPath,
                        hasProjectPermission
                    });
                    return true;
                }
            }
            
            // 如果allowedPaths为空，说明还没有获取到权限数据，只允许访问基本页面
            if (this.allowedPaths.length === 0) {
                return false; // 基本路径已经在上面检查过了
            }
            
            // 使用智能路径匹配检查权限
            for (const allowedPath of this.allowedPaths) {
                if (this.isPathMatch(allowedPath, path)) {
                    return true;
                }
            }
            
            // 调试信息：记录权限检查失败的情况
            console.log('权限检查失败:', {
                path,
                allowedPaths: this.allowedPaths,
                basicPaths,
                isProjectPath
            });
            
            return false;
        },
        
        // 获取完整的菜单数据
        getMenuData(): MenuItem[] {
            return this.menuData;
        },
        
        // 清除权限数据（用于切换用户时）
        clearPermissions() {
            this.allowedPaths = [];
            this.menuData = [];
            this.isFetching = false; // 重置获取状态
        },

        /** 从登录返回的 userInfo.perms 设置可访问路径（用于菜单展示与路由权限） */
        setAllowedPathsFromPerms(perms: { path?: string }[] | null | undefined) {
            if (!perms || !Array.isArray(perms)) {
                this.allowedPaths = [];
                return;
            }
            this.allowedPaths = perms
                .map((p) => (p.path ? String(p.path).trim() : ''))
                .filter(Boolean);
            this.ensureBasicPermissions();
        },
    },
});

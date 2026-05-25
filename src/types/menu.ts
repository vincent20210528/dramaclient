// 菜单权限相关类型定义
export interface MenuMeta {
    title: string;
    icon?: string;
    noCache?: boolean;
    link?: string | null;
}

export interface MenuItem {
    name: string;
    path: string;
    hidden?: boolean;
    redirect?: string;
    component?: string;
    alwaysShow?: boolean;
    meta: MenuMeta;
    children?: MenuItem[];
}

export interface RouterResponse {
    msg: string;
    code: number;
    data: MenuItem[];
}

// 保留原来的Menus类型用于向后兼容
export interface Menus {
    id: string;
    pid?: string;
    icon?: string;
    index: string;
    title: string;
    permiss?: string;
    children?: Menus[];
}
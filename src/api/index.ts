import request from '../utils/request'

export const fetchData = () => {
    return request({
        url: './mock/table.json',
        method: 'get',
    })
}

export const fetchUserData = (params?: {
    pageNum?: number
    pageSize?: number
    userName?: string
    phonenumber?: string
}) => {
    return request({
        url: '/system/user/list',
        method: 'get',
        params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 10,
            ...(params?.userName && { userName: params.userName }),
            ...(params?.phonenumber && { phonenumber: params.phonenumber }),
        },
    })
}

/** 用户列表分页（短剧管理平台）GET /api/users/page，支持按用户账号 userName 搜索 */
export const getUsersPage = (params?: { current?: number; size?: number; userName?: string }) => {
    return request({
        url: '/api/users/page',
        method: 'get',
        params: {
            current: params?.current ?? 1,
            size: params?.size ?? 10,
            ...(params?.userName?.trim() && { userName: params.userName.trim() }),
        },
    })
}

export const createUser = (data: any) => {
    return request({
        url: '/system/user',
        method: 'post',
        data,
    })
}

/** 新增用户 POST /api/users/add */
export const addUser = (data: {
    userName: string
    nickName?: string
    email?: string
    phoneNumber?: string
    sex?: string
    avatar?: string
    password?: string
    status?: number
    roleId?: number
}) => {
    return request({
        url: '/api/users/add',
        method: 'post',
        data: {
            userName: data.userName,
            ...(data.nickName != null && data.nickName !== '' && { nickName: data.nickName }),
            ...(data.email != null && data.email !== '' && { email: data.email }),
            ...(data.phoneNumber != null && data.phoneNumber !== '' && { phoneNumber: data.phoneNumber }),
            ...(data.sex != null && data.sex !== '' && { sex: data.sex }),
            ...(data.avatar != null && data.avatar !== '' && { avatar: data.avatar }),
            ...(data.password != null && data.password !== '' && { password: data.password }),
            status: data.status ?? 1,
            ...(data.roleId != null && { roleId: Number(data.roleId) }),
        },
    })
}

/** 更新用户 PUT /api/users/update */
export const updateUserApi = (data: {
    id: number
    userName: string
    nickName?: string
    email?: string
    phoneNumber?: string
    sex?: string
    avatar?: string
    status?: number
    roleId?: number
}) => {
    return request({
        url: '/api/users/update',
        method: 'put',
        data: {
            id: data.id,
            userName: data.userName,
            ...(data.nickName != null && data.nickName !== '' && { nickName: data.nickName }),
            ...(data.email != null && data.email !== '' && { email: data.email }),
            ...(data.phoneNumber != null && data.phoneNumber !== '' && { phoneNumber: data.phoneNumber }),
            ...(data.sex != null && data.sex !== '' && { sex: data.sex }),
            avatar: data.avatar ?? '',
            status: data.status ?? 1,
            ...(data.roleId != null && { roleId: Number(data.roleId) }),
        },
    })
}

// 获取用户详情
export const getUserDetail = (userId: number) => {
    return request({
        url: `/system/user/${userId}`,
        method: 'get',
    })
}

// 删除用户
export const deleteUser = (userId: number) => {
    return request({
        url: `/system/user/${userId}`,
        method: 'delete',
    })
}

// 编辑用户
export const updateUser = (data: any) => {
    return request({
        url: '/system/user',
        method: 'put',
        data,
    })
}

export const getRoleListOld = () => {
    return request({
        url: '/system/user/',
        method: 'get',
    })
}

export const fetchRoleData = () => {
    return request({
        url: './mock/role.json',
        method: 'get',
    })
}

// 获取角色列表
export const getRoleList = (params?: {
    pageNum?: number
    pageSize?: number
    roleName?: string
}) => {
    return request({
        url: '/system/role/list',
        method: 'get',
        params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 10,
            ...(params?.roleName && { roleName: params.roleName }),
        },
    })
}

/** 角色列表分页 GET /api/roles/page?current=1&size=10，需携带 token */
export const getRolesPage = (params?: { current?: number; size?: number; roleName?: string }) => {
    return request({
        url: '/api/roles/page',
        method: 'get',
        params: {
            current: params?.current ?? 1,
            size: params?.size ?? 10,
            ...(params?.roleName && { roleName: params.roleName }),
        },
    })
}

/** 新增角色 POST /api/roles/add，参数: roleName, roleCode, description */
export const addRole = (data: { roleName: string; roleCode: string; description?: string }) => {
    return request({
        url: '/api/roles/add',
        method: 'post',
        data: {
            roleName: data.roleName,
            roleCode: data.roleCode,
            description: data.description ?? '',
        },
    })
}

/** 角色关联的菜单树（含已选）GET /api/menus/roleMenuTreeSelect/{roleId} */
export const getRoleMenuTreeSelect = (roleId: number) => {
    return request({
        url: `/api/menus/roleMenuTreeSelect/${roleId}`,
        method: 'get',
    })
}

/** 更新角色（含菜单权限）PUT /api/roles/update */
export const updateRoleApi = (data: {
    role: { id: number; roleName: string; roleCode: string; description?: string }
    menuIds: number[]
}) => {
    return request({
        url: '/api/roles/update',
        method: 'put',
        data: {
            role: {
                id: data.role.id,
                roleName: data.role.roleName,
                roleCode: data.role.roleCode,
                description: data.role.description ?? '',
            },
            menuIds: data.menuIds ?? [],
        },
    })
}

// 创建角色
export const createRole = (data: {
    roleName: string
    roleKey: string
    roleSort: number
    status: string
    menuIds: number[]
    deptIds: number[]
    menuCheckStrictly: boolean
    deptCheckStrictly: boolean
    remark: string
}) => {
    return request({
        url: '/system/role',
        method: 'post',
        data,
    })
}

// 获取角色列表(排除开发者)
export const getRolesList = () => {
    return request({
        url: '/api/roles/list',
        method: 'get',
    })
}


export const loginApi = (params: { userName: string; password: string }) => {
    return request({
        url: '/api/users/login',
        data: params,
        method: 'post',
    })
}

/**
 * 腾讯云点播上传签名 GET /api/file/tx/upload-signature?sourceContext=vid_集数（如 1234_3）
 * 使用 URL 查询串显式拼接，避免部分环境下 axios params 未带上导致后端报缺少 sourceContext。
 */
export const getTxVodUploadSignature = (sourceContext: string) => {
    const sc = String(sourceContext ?? '').trim()
    if (!sc) {
        return Promise.reject(new Error('缺少 sourceContext'))
    }
    const q = encodeURIComponent(sc)
    return request({
        url: `/api/file/tx/upload-signature?sourceContext=${q}`,
        method: 'get',
    })
}

/** 退出登录 PUT /api/users/logout，请求头携带 Authorization */
export const logoutApi = (token?: string | null) => {
    const resolvedToken = token ?? (localStorage.getItem('token') || localStorage.getItem('agent_token'))
    return request({
        url: '/api/users/logout',
        method: 'put',
        // 兜底：显式带上 token，避免前端清理过快导致拦截器取不到
        headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : undefined,
    })
}

/** 当前登录用户修改密码 POST /api/users/updatePassword */
export const updatePassword = (data: {
    oldPassword: string
    newPassword: string
    confirmPassword: string
}) => {
    return request({
        url: '/api/users/updatePassword',
        method: 'post',
        data: {
            oldPassword: data.oldPassword,
            newPassword: data.newPassword,
            confirmPassword: data.confirmPassword,
        },
    })
}

// 获取菜单路由接口
export const getRouters = () => {
    return request({
        url: '/getRouters',
        method: 'get',
    })
}

// 获取菜单路由（直接调用后端API）
export const getMenuRouters = () => {
    return getRouters()
}

// // LDAP认证登录接口
// export const loginLdAuth = (params: { username: string; token: string }) => {
//     return request({
//         url: '/loginLdAuth',
//         method: 'post',
//         data: params,
//     })
// }

// 获取商户账户列表
export const getChannelAccountList = (params?: {
    pageNum?: number
    pageSize?: number
    companyName?: string
    channelId?: string
}) => {
    return request({
        url: '/api/account/list',
        method: 'get',
        params: {
            pageNum: params?.pageNum || 1,
            pageSize: params?.pageSize || 10,
            ...(params?.companyName && { companyName: params.companyName }),
            ...(params?.channelId && { channelId: params.channelId }),
        },
    })
}

// 获取商户充值详情列表
export const getChannelRechargeList = (params: {
    pageNum: number
    pageSize: number
    channelInfoId: number
}) => {
    return request({
        url: '/api/accountlog/list',
        method: 'get',
        params,
    })
}

// 编辑角色
export const updateRole = (data: {
    roleId: number
    roleName: string
    roleKey: string
    roleSort: number
    status: string
    menuIds: number[]
    deptIds: number[]
    menuCheckStrictly: boolean
    deptCheckStrictly: boolean
    remark: string
}) => {
    return request({
        url: '/system/role',
        method: 'put',
        data,
    })
}

// 删除角色
export const deleteRole = (roleId: number) => {
    return request({
        url: `/system/role/${roleId}`,
        method: 'delete',
    })
}

// 获取角色菜单树
export const getRoleMenuTree = (roleId: number) => {
    return request({
        url: `/system/menu/roleMenuTreeselect/${roleId}`,
        method: 'get',
    })
}

// 获取菜单列表
export const getMenuList = () => {
    return request({
        url: '/system/menu/list',
        method: 'get',
    })
}

// 更新菜单
export const updateMenu = (data: {
    menuName: string
    menuId: number
    path: string
    parentId: number
    menuType: string
    isFrame: string
    isCache: string
    visible: string
    status: string
}) => {
    return request({
        url: '/system/menu',
        method: 'put',
        data,
    })
}

// 创建菜单
export const createMenu = (data: {
    menuName: string
    path: string
    parentId: number
    menuType: string
    isFrame: string
    isCache: string
    visible: string
    status: string
    orderNum: number
    icon?: string
    perms?: string
}) => {
    return request({
        url: '/system/menu',
        method: 'post',
        data,
    })
}

// 获取菜单详情
export const getMenuDetail = (menuId: number) => {
    return request({
        url: `/system/menu/${menuId}`,
        method: 'get',
    })
}

// 删除菜单
export const deleteMenu = (menuId: number) => {
    return request({
        url: `/system/menu/${menuId}`,
        method: 'delete',
    })
}

// ========== 短剧 - 支持语言（语言字典） ==========

/** 支持语言分页列表（含搜索） POST /api/supportLanguage/page */
export const getSupportLanguagePage = (data: {
    current: number
    size: number
    param?: string
}) => {
    return request({
        url: '/api/supportLanguage/page',
        method: 'post',
        data: {
            current: data.current,
            size: data.size,
            ...(data.param?.trim() && { param: data.param.trim() }),
        },
    })
}

/** 添加支持语言 POST /api/supportLanguage/add */
export const addSupportLanguage = (data: {
    languageCode: string
    languageName: string
}) => {
    return request({
        url: '/api/supportLanguage/add',
        method: 'post',
        data: {
            languageCode: data.languageCode,
            languageName: data.languageName,
        },
    })
}

/** 编辑支持语言（仅更新语言名称） POST /api/supportLanguage/update */
export const updateSupportLanguage = (data: { id: number; languageName: string }) => {
    return request({
        url: '/api/supportLanguage/update',
        method: 'post',
        data: {
            id: data.id,
            languageName: data.languageName,
        },
    })
}

/** 删除支持语言 DELETE /api/supportLanguage/delete/{id}，若该语言下有分类数据则不可删除 */
export const deleteSupportLanguage = (id: number) => {
    return request({
        url: `/api/supportLanguage/delete/${id}`,
        method: 'delete',
    })
}

// ========== 短剧 - 分类管理 ==========

/** 分类列表 GET /api/categoryInfo/list */
export const getCategoryInfoList = (params?: { languageCode?: string }) => {
    return request({
        url: '/api/categoryInfo/list',
        method: 'get',
        params:
            params?.languageCode?.trim()
                ? { languageCode: params.languageCode.trim() }
                : undefined,
    })
}

/** 分类分页列表 POST /api/categoryInfo/page */
export const getCategoryInfoPage = (data: {
    current: number
    size: number
    languageCode: string
    categoryName: string
}) => {
    return request({
        url: '/api/categoryInfo/page',
        method: 'post',
        data: {
            current: data.current,
            size: data.size,
            languageCode: (data.languageCode ?? '').trim(),
            categoryName: (data.categoryName ?? '').trim(),
        },
    })
}

/** 添加分类 POST /api/categoryInfo/add，同语言下分类名称唯一 */
export const addCategoryInfo = (data: {
    categoryName: string
    languageCode: string
    categoryNameLanguage?: string
}) => {
    return request({
        url: '/api/categoryInfo/add',
        method: 'post',
        data: {
            categoryName: data.categoryName,
            languageCode: data.languageCode,
            ...(data.categoryNameLanguage != null && data.categoryNameLanguage !== '' && { categoryNameLanguage: data.categoryNameLanguage }),
        },
    })
}

/** 编辑分类 PUT /api/categoryInfo/update */
export const updateCategoryInfo = (data: {
    id: number
    categoryName: string
    languageCode: string
    categoryNameLanguage?: string
}) => {
    return request({
        url: '/api/categoryInfo/update',
        method: 'put',
        data: {
            id: data.id,
            categoryName: data.categoryName,
            languageCode: data.languageCode,
            ...(data.categoryNameLanguage != null && data.categoryNameLanguage !== '' && { categoryNameLanguage: data.categoryNameLanguage }),
        },
    })
}

/** 删除分类 DELETE /api/categoryInfo/delete/{id} */
export const deleteCategoryInfo = (id: number) => {
    return request({
        url: `/api/categoryInfo/delete/${id}`,
        method: 'delete',
    })
}

// ========== 短剧 - 情节标签 ==========

/** 情节标签分页列表 POST /api/tagInfo/page */
export const getTagInfoPage = (data: {
    current: number
    size: number
    languageCode: string
    tagName: string
}) => {
    return request({
        url: '/api/tagInfo/page',
        method: 'post',
        data: {
            current: data.current,
            size: data.size,
            languageCode: (data.languageCode ?? '').trim(),
            tagName: (data.tagName ?? '').trim(),
        },
    })
}

/** 添加情节标签 POST /api/tagInfo/add */
export const addTagInfo = (data: {
    languageCode: string
    tagNameLanguage: string
    tagName: string
}) => {
    return request({
        url: '/api/tagInfo/add',
        method: 'post',
        data: {
            languageCode: data.languageCode,
            tagNameLanguage: data.tagNameLanguage,
            tagName: data.tagName,
        },
    })
}

/** 编辑情节标签 PUT /api/tagInfo/update */
export const updateTagInfo = (data: {
    id: number
    tagCode: string
    languageCode: string
    tagNameLanguage: string
    tagName: string
}) => {
    return request({
        url: '/api/tagInfo/update',
        method: 'put',
        data: {
            id: data.id,
            tagCode: data.tagCode,
            languageCode: data.languageCode,
            tagNameLanguage: data.tagNameLanguage,
            tagName: data.tagName,
        },
    })
}

/** 删除情节标签 DELETE /api/tagInfo/delete/{id} */
export const deleteTagInfo = (id: number) => {
    return request({
        url: `/api/tagInfo/delete/${id}`,
        method: 'delete',
    })
}

/** 情节标签列表（筛选用）GET /api/tagInfo/list */
export const getTagInfoList = (params?: { languageCode?: string }) => {
    return request({
        url: '/api/tagInfo/list',
        method: 'get',
        ...(params?.languageCode ? { params: { languageCode: params.languageCode } } : {}),
    })
}

// ========== 内容等级 ==========

/** 内容等级列表 GET /api/contentRating/list */
export const getContentRatingList = () => {
    return request({
        url: '/api/contentRating/list',
        method: 'get',
    })
}

/** 新增内容等级 POST /api/contentRating/add */
export const addContentRating = (data: {
    ratingName: string
    ratingCode: string
    ratingValue: number
}) => {
    return request({
        url: '/api/contentRating/add',
        method: 'post',
        data: {
            ratingName: data.ratingName,
            ratingCode: data.ratingCode,
            ratingValue: data.ratingValue,
        },
    })
}

/** 更新内容等级 PUT /api/contentRating/update */
export const updateContentRating = (data: {
    id: number
    ratingName: string
    ratingCode: string
    ratingValue: number
}) => {
    return request({
        url: '/api/contentRating/update',
        method: 'put',
        data: {
            id: data.id,
            ratingName: data.ratingName,
            ratingCode: data.ratingCode,
            ratingValue: data.ratingValue,
        },
    })
}

/** 删除内容等级 DELETE /api/contentRating/delete/{id} */
export const deleteContentRating = (id: number) => {
    return request({
        url: `/api/contentRating/delete/${id}`,
        method: 'delete',
    })
}

// ========== 菜单管理 ==========

/** 菜单树 GET /api/menus/tree */
export const getMenusTree = () => {
    return request({
        url: '/api/menus/tree',
        method: 'get',
    })
}

/** 新增菜单 POST /api/menus/add */
export const addMenuApi = (data: {
    parentId: number
    menuName: string
    path: string
    component?: string
    menuType: string
    visible: number
    status: number
    perms?: string
    icon?: string
    sort: number
}) => {
    return request({
        url: '/api/menus/add',
        method: 'post',
        data: {
            parentId: data.parentId,
            menuName: data.menuName,
            path: data.path ?? '',
            component: data.component ?? 'Layout',
            menuType: data.menuType,
            visible: data.visible,
            status: data.status,
            perms: data.perms ?? '',
            icon: data.icon ?? '',
            sort: data.sort,
        },
    })
}

/** 更新菜单 PUT /api/menus/update */
export const updateMenuApi = (data: {
    id: number
    parentId: number
    menuName: string
    path: string
    component?: string
    menuType: string
    visible: number
    status: number
    perms?: string
    icon?: string
    sort: number
}) => {
    return request({
        url: '/api/menus/update',
        method: 'put',
        data: {
            id: data.id,
            parentId: data.parentId,
            menuName: data.menuName,
            path: data.path ?? '',
            component: data.component ?? 'Layout',
            menuType: data.menuType,
            visible: data.visible,
            status: data.status,
            perms: data.perms ?? '',
            icon: data.icon ?? '',
            sort: data.sort,
        },
    })
}

/** 删除菜单 DELETE /api/menus/id/{id}，有子菜单或已关联角色时不可删除 */
export const deleteMenuApi = (id: number) => {
    return request({
        url: `/api/menus/id/${id}`,
        method: 'delete',
    })
}

export interface Role {
    roleId: number;
    roleName: string;
    roleKey: string;
    roleSort: number;
    status: string; // 0正常，1停用
    menuIds: number[];
    deptIds: number[];
    menuCheckStrictly: boolean;
    deptCheckStrictly: boolean;
    remark: string;
    createTime: string;
    permiss?: string[];
    flag:boolean
}

export interface CreateRoleData {
    roleName: string;
    roleKey: string;
    roleSort: number;
    status: string;
    menuIds: number[];
    deptIds: number[];
    menuCheckStrictly: boolean;
    deptCheckStrictly: boolean;
    remark: string;
}
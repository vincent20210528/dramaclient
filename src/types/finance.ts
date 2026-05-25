// 商户数据类型定义
export interface financeData {
    id: number,
    channelId: string,
    companyName: string,
    voucherPath: string,
    paths?: string[], // 新增：图片路径数组
    amount: string,
    confirmVoucherPath: string,
    confirmPaths?: string[], // 新增：确认凭证图片路径数组
    status: number,
    paymentRefundMethod: string,
    paymentRefundTime: string,
    remark: string,
    refundType: number,
    refundAccount: string,
    createTime: string,
    updateTime: string,
    confirmRemark: string,
    operator: string,
    type: number,
    contractSignStatus?: number
}

// 查询参数类型
export interface ChannelQueryParams {
    channelId?: string;
    companyName?: string;
    businessManagerPhone? : string;
    status?: number;
    type?: number;
    startTime?: string;
    endTime?: string;
    current?: number;
    size?: number;
}

// 分页响应类型
export interface PageResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

// 商户状态枚举
export enum ChannelStatus {
    DISABLED = 0,
    ENABLED = 1
}

// 付款状态枚举
export enum PaymentStatus {
    UNPAID = 0,
    PAID = 1
}

// 合同签署状态枚举
export enum ContractSignStatus {
    UNSIGNED = 0,
    SIGNED = 1
}

// 资质状态枚举
export enum QualificationStatus {
    UNAUDITED = 0,
    AUDITED = 1
}

// 商户账户类型定义
export interface ChannelAccount {
    id: number;
    channelId: string;
    companyName: string;
    accountBalance: number;
    consumedAmount?: number;
    createTime: string;
    updateTime?: string;
    status?: number;
    remark?: string;
    channelInfoId: number;
}

// 商户账户查询参数
export interface ChannelAccountQueryParams {
    pageNum?: number;
    pageSize?: number;
    companyName?: string;
    channelId?: string;
}

// 商户充值详情类型定义
export interface ChannelRechargeDetail {
    id: number;
    channelInfoId: number;
    channelId: string;
    companyName: string;
    coinType: number;
    changeBalance: number;
    sourceType: number;
    createTime: string;
    remark: string;
}

// 商户充值详情查询参数
export interface ChannelRechargeQueryParams {
    pageNum: number;
    pageSize: number;
    channelInfoId: number;
}

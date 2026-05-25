// 平台账户数据类型定义
export interface PlatformAccountData {
  id: number;
  channelId: string;
  splitPaymentId?: string;
  earingTitle: string;
  earningsType: number;
  customerPhone: string; // 购买人手机号
  feeItemName: string; // 费项
  productName: string; // 商品名称
  status: number; // 结算状态
  amount: number; // 金额
  orderCompleteTime: string; // 订单完成时间
  bizCode?: string;
  orderNo?: string;
  createTime: string; // 结算时间（创建时间）
  bfiMerchantCode: string; // 业财商编号码
}

// 平台账户查询参数类型
export interface PlatformAccountQueryParams {
  page?: number;
  pageSize?: number;
  beginTime?: string;
  endTime?: string;
  customerPhone?: string; // 购买人手机号
}

// 平台账户列表响应类型
export interface PlatformAccountListResponse {
  code: number;
  msg: string;
  data: {
    rows: PlatformAccountData[];
    total: number;
    size: number;
    current: number;
  };
}

// 平台收益总览响应类型
export interface PlatformRevenueResponse {
  code: number;
  msg: string;
  data: {
    amountTotal: number; // 总收益（元）
    bfiMerchantCode: string; // 业财商编号码
  };
}


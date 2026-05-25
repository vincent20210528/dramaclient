// 订单数据类型定义
export interface OrderData {
  id: number;
  bizCode: string;
  bizSource: string;
  bizType: string;
  adid: string;
  ldOrderId?: string;
  promotionId: string;
  promotionPhone?: string;
  promotionChannelId?: string;
  promotionUserKey?: string;
  tradeUserKey?: string;
  orderNo?: string;
  orderType?: string;
  payAmount: number;
  subAmount: number;
  totalAmount: number;
  orderExtraJson: string;
  channelId: string;
  phone: string;
  taskId: number;
  userId: number;
  adidChannelId?: string;
  adidPhone?: string;
  adidTaskId?: number;
  adidUserId?: number;
  buyPhone: string;
  createTime: string;
  ldPromotionUserPhone?: string;
  userName?: string; // 用户名称（任务列表使用）
  nftName?: string; // NFT名称（任务列表使用）
}

// 订单查询参数类型
export interface OrderQueryParams {
  pageNum?: number;
  pageSize?: number;
  channelId?: string;
  bizCode?: string; // 订单号（订单列表使用）
  phone?: string; // 手机号码（订单列表使用）
  buyPhone?: string; // 购买人手机号（订单列表使用）
  ldPromotionUserPhone?: string; // 推广员手机号码（任务列表使用）
  taskId?: string; // 任务ID（用于任务列表搜索）
  bizType?: string;
  startTime?: string;
  endTime?: string;
  adType?: string; // 广告类型：CPA（订单列表）或 CPS（任务列表）
}

// 订单列表响应类型
export interface OrderListResponse {
  code: number;
  message: string;
  data: {
    records: OrderData[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
  timestamp: number;
  version: string;
}


// 订单类型枚举
export enum OrderType {
  RECHARGE = '100',    // 充值
  CONSUME = '200',     // 消费
  REFUND = '300'       // 退款
}
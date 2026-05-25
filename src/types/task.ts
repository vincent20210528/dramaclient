// 任务列表数据类型定义
export interface TaskData {
  id: number;
  taskId: number;
  taskName: string;
  promoter: string; // 推广员
  promoterPhone: string; // 推广员手机号码
  registrant: string; // 注册人
  registrantPhone: string; // 注册人手机号码
  taskSource: string; // 任务来源
  completeTime: string; // 任务完成时间
}

// 任务列表查询参数类型
export interface TaskQueryParams {
  pageNum?: number;
  pageSize?: number;
  taskId?: string;
  phone?: string;
}

// 任务列表响应类型
export interface TaskListResponse {
  code: number;
  message: string;
  data: {
    records: TaskData[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
  timestamp: number;
  version: string;
}

// 任务明细记录类型
export interface TaskDetailRecord {
  id: string;
  userType: string; // ENTERPRISE | PERSON
  userId: string;
  taskId: string;
  taskName: string;
  channelId: string;
  channelName: string;
  commissionAmount: number;
  taskCompleteTime: string;
  createTime: string;
  updateTime: string;
  bizCode: string;
  projectId: string;
  promotionId: string;
  adId: string;
  completerDisplayId: string;
  completerName: string;
  completerPhone: string;
  completerTitle: string;
  buyerName: string;
  buyerPhone: string;
  feeItemName: string;
  feeItemCode: string;
  settlementStatus?: number; // 1: 已结算, 其他: 待结算
}

// 任务明细查询参数类型
export interface TaskDetailQueryParams {
  id?: string;
  pageNum?: number;
  pageSize?: number;
  type?: string; // 'crop' | 'person'
  taskId?: string;
  taskName?: string; // 任务名称
  phone?: string; // 推广员手机号码
  channelId?: string;
}

// 任务明细列表响应类型
export interface TaskDetailListResponse {
  code: number;
  msg: string;
  data: {
    records: TaskDetailRecord[];
    total: number;
    size: number;
    current: number;
    pages: number;
  };
}

// 任务详情查询参数类型
export interface TaskDetailViewParams {
  taskId: string;
  channelId: string;
}

// 任务详情响应类型
export interface TaskDetailViewResponse {
  code: number;
  msg: string;
  data: TaskDetailRecord;
}


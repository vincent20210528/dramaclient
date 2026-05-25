// 商户申请相关类型定义

// 商户申请列表项
export interface MerchantApplication {
  id: string;
  companyName: string; // 公司名称
  contactName: string; // 姓名
  contactPhone: string; // 手机号码
  applicationTime: string; // 申请时间
  referrerPhone: string; // 推荐人手机号码
  referrerId: string; // 推荐人ID
  cooperationProjects: string; // 合作项目
  remark: string; // 备注
}

// 查询参数
export interface MerchantApplicationQueryParams {
  companyName?: string;
  contactName?: string;
  contactPhone?: string;
  pageNum?: number;
  pageSize?: number;
}

// 列表响应
export interface MerchantApplicationListResponse {
  code: number;
  msg: string;
  rows: MerchantApplication[];
  total: number;
}

// 详情响应
export interface MerchantApplicationDetailResponse {
  code: number;
  msg: string;
  data: MerchantApplication;
}

// 代理商类型配置相关类型定义

// 商户类型配置项
export interface MerchantTypeConfig {
  channelTypeId: number;
  channelTypeName: string; // 商户类型名称
  autoCode: string; // 可查看项目
  createTime: string; // 创建时间
  remark?: string; // 备注
}

// 商户类型配置详情（用于编辑页面）
export interface MerchantTypeConfigDetail {
  channelTypeId: number;
  channelTypeName: string; // 商户类型名称
  viewableProjectIds: string; // 可查看项目（逗号分隔的字符串）
  createTime: string; // 创建时间
  remark?: string; // 备注
}

// 商户类型配置查询参数
export interface MerchantTypeConfigQueryParams {
  typeName?: string; // 商户类型名称（搜索条件）
  pageNo?: number; // 页码
  pageSize?: number; // 每页大小
}

// 商户类型配置列表响应
export interface MerchantTypeConfigListResponse {
  code: number;
  msg: string;
  rows: MerchantTypeConfig[];
}

// 商户类型配置详情响应
export interface MerchantTypeConfigDetailResponse {
  code: number;
  msg: string;
  data: MerchantTypeConfigDetail;
}

// 商户类型配置表单
export interface MerchantTypeConfigForm {
  id?: number;
  channelTypeId?: number;
  channelTypeName: string;
  viewableProjectIds: string;
  remark?: string;
}

// 项目信息
export interface ProjectInfo {
  id: number;
  projectName: string;
  companyName: string;
}

// 项目列表响应
export interface ProjectListResponse {
  code: number;
  msg: string;
  rows: ProjectInfo[];
}

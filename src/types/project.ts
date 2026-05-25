// 项目数据接口
export interface ProjectData {
  id: number;
  projectId: string;
  projectName: string;
  projectTags: string;
  projectDescription?: string;
  projectDesc?: string; // 项目简介
  image?: string;
  sliderImages?: string[];
  cooperationRequirements?: string;
  createTime: string;
  remark?: string;
}

// API响应数据接口
export interface ProjectListResponse {
  total: number;
  rows: ProjectData[];
  code: number;
  msg: string;
  data: any;
}

// 项目详情响应接口
export interface ProjectDetailResponse {
  code: number;
  msg: string;
  data: ProjectData;
}

// 项目查询参数接口
export interface ProjectQueryParams {
  projectId?: string;
  projectName?: string;
  status?: number;
  current?: number;
  size?: number;
  startTime?: string;
  endTime?: string;
}

// 项目状态枚举
export enum ProjectStatus {
  DRAFT = 1,      // 草稿
  ACTIVE = 2,     // 进行中
  COMPLETED = 3,  // 已完成
  SUSPENDED = 4,  // 已暂停
  CANCELLED = 5   // 已取消
}

// 项目状态文本映射
export const PROJECT_STATUS_TEXT = {
  [ProjectStatus.DRAFT]: '草稿',
  [ProjectStatus.ACTIVE]: '进行中',
  [ProjectStatus.COMPLETED]: '已完成',
  [ProjectStatus.SUSPENDED]: '已暂停',
  [ProjectStatus.CANCELLED]: '已取消'
};

// 项目状态标签类型映射
export const PROJECT_STATUS_TAG_TYPE = {
  [ProjectStatus.DRAFT]: 'info',
  [ProjectStatus.ACTIVE]: 'success',
  [ProjectStatus.COMPLETED]: 'success',
  [ProjectStatus.SUSPENDED]: 'warning',
  [ProjectStatus.CANCELLED]: 'danger'
} as const;

// 1. 定义用户信息类型
export interface UserInfo {
  token: string;
  phone: string;
  [key: string]: any;
}
// 2. 导出 getUserInfo 方法
export function getUserInfo(): Promise<UserInfo> {
  return new Promise((resolve, reject) => {
    // 1. 发送请求
    window.parent.postMessage({ type: 'GET_USER_INFO' }, '*');

    // 2. 监听响应
    const handler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'USER_INFO_RESPONSE') {
        window.removeEventListener('message', handler);
        resolve(event.data.payload as UserInfo);
      }
    };

    // 3. 超时处理
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject('Timeout');
    }, 50000);

    window.addEventListener('message', handler);
  });
}

// 兼容 window.getUserInfo
(window as any).getUserInfo = getUserInfo;

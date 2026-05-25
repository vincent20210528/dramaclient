/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'vue-schart';
declare module 'nprogress'


// 声明remoteBridge类型
declare global {
  interface Window {
    remoteBridge: {
      getUserInfo(): Promise<{
        token: string;
        phone: string;
      }>;
    };
  }
}

export {};
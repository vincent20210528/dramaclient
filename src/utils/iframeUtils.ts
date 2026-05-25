/**
 * 监听来自父窗口的消息
 */
export const listenToParentMessage = (callback: (message: any) => void): (() => void) => {
    const handleMessage = (event: MessageEvent) => {
        // 可以在这里添加消息来源验证
        callback(event.data)
    }

    window.addEventListener('message', handleMessage)

    // 返回清理函数
    return () => {
        window.removeEventListener('message', handleMessage)
    }
}

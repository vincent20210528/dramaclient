/**
 * 节流：在 wait 毫秒内最多执行一次（首次调用立即执行，冷却期内再次调用会被忽略）
 * 用于按钮点击等场景，防止用户频繁点击触发多次请求
 * @param fn 要节流的函数（可带参数）
 * @param wait 冷却时间（毫秒）
 * @returns 节流后的函数，签名与 fn 一致
 */
export function throttle<T extends (...args: any[]) => any>(
    fn: T,
    wait: number
): (...args: Parameters<T>) => void {
    let last = 0
    return function (this: any, ...args: Parameters<T>) {
        const now = Date.now()
        if (now - last >= wait) {
            last = now
            fn.apply(this, args)
        }
    }
}

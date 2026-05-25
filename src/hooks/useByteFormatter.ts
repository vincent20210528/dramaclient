/**
 * 字节单位。
 * - auto: 自动按数值选择最合适单位
 * - B/KB/MB/GB: 强制输出到指定单位
 */
export type ByteUnit = 'auto' | 'B' | 'KB' | 'MB' | 'GB'

const BYTE_BASE = 1000  //腾讯云的流量 是按进制换算规则：1GB = 1000MB、1 MB= 1000 KB; 1Gbps = 1000Mbps、1Mbps = 1000Kbps 来算的

function normalizeBytes(input: number | string | null | undefined): number | null {
    const n = Number(input ?? 0)
    if (!Number.isFinite(n) || n < 0) return null
    return n
}

/**
 * 将字节值转换为指定单位数值（不带单位后缀）。
 * 例如：toUnit(1073741824, 'GB') => 1
 */
function toUnit(bytes: number | string | null | undefined, unit: Exclude<ByteUnit, 'auto'>): number | null {
    const n = normalizeBytes(bytes)
    if (n == null) return null
    if (unit === 'B') return n
    if (unit === 'KB') return n / BYTE_BASE
    if (unit === 'MB') return n / BYTE_BASE ** 2
    return n / BYTE_BASE ** 3
}

/**
 * 将字节值格式化为字符串，默认自动选择单位。
 * 示例：
 * - format(1536) => "1.50 KB"
 * - format(1536, 'MB', 4) => "0.0015 MB"
 */
function format(
    bytes: number | string | null | undefined,
    unit: ByteUnit = 'auto',
    fractionDigits: number = 2,
): string {
    const n = normalizeBytes(bytes)
    if (n == null) return '--'

    const digits = Math.max(0, Number.isFinite(fractionDigits) ? Math.floor(fractionDigits) : 2)

    if (unit !== 'auto') {
        const v = toUnit(n, unit)
        if (v == null) return '--'
        return `${v.toFixed(digits)} ${unit}`
    }

    if (n < BYTE_BASE) return `${n.toFixed(0)} B`
    if (n < BYTE_BASE ** 2) return `${(n / BYTE_BASE).toFixed(digits)} KB`
    if (n < BYTE_BASE ** 3) return `${(n / BYTE_BASE ** 2).toFixed(digits)} MB`
    return `${(n / BYTE_BASE ** 3).toFixed(digits)} GB`
}

/**
 * Byte 格式化 hooks。
 * 提供：
 * - format: 输出带单位字符串
 * - toUnit: 输出指定单位的纯数值
 */
export function useByteFormatter() {
    return {
        format,
        toUnit,
    }
}


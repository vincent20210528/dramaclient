<template>
    <!--
      不在模板里写 <video>：TCPlayer（video.js）会改写/包裹 video，与 Vue 的 vnode 不一致时卸载会触发 insertBefore 等 DOM 错误。
      仅保留空 div，由脚本创建 video 并 append；卸载时 dispose 后清空 host，避免残留节点。
    -->
    <div ref="hostRef" class="drama-preview-tcplayer-root" />
</template>

<script setup lang="ts">
/**
 * 短剧预览：腾讯云 TCPlayer 封装。
 * 生命周期：onMounted 创建实例、onBeforeUnmount 中 dispose，与父级 :key 换集配合，保证先卸载再销毁播放器。
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import TCPlayer from 'tcplayer.js'
import 'tcplayer.js/dist/tcplayer.min.css'

/** 父组件传入的当前集播放所需字段（fileId + playSign 为点播鉴权播放） */
export type DramaPreviewEpisode = {
    id: string
    no: number
    fileId?: string
    playSign?: string
}

const props = defineProps<{
    episode: DramaPreviewEpisode
}>()

const emit = defineEmits<{
    /** 播放器可交互/已尝试播放时通知父级，用于关闭「切换中」禁用态 */
    (e: 'ready'): void
}>()

/** 腾讯云播放器 License（与项目控制台绑定，勿随意更换） */
const tcPlayerLicenseUrl = 'https://1259563749.trtcube-license.cn/license/v2/1259563749_1/v_cube.license'

/** 挂载 TCPlayer 的容器，Vue 只管理这一层 div，内部 DOM 由 TCPlayer 与脚本创建的 video 组成 */
const hostRef = ref<HTMLDivElement | null>(null)
let player: any = null
/** ready 兜底定时器：部分环境下 ready 回调极慢或异常，超时后仍要通知父级解锁 UI */
let fallbackTimer: number | null = null
/** 防止 ready 回调与兜底定时器重复 emit('ready') */
let readyEmitted = false

/**
 * 清除兜底定时器（在 player.ready 成功触发时调用，避免与 setTimeout 双发）。
 */
function clearFallback() {
    if (fallbackTimer != null) {
        clearTimeout(fallbackTimer)
        fallbackTimer = null
    }
}

/**
 * 仅首次向父组件派发 ready，避免多次解锁或重复逻辑。
 */
function finishReadyOnce() {
    if (readyEmitted) return
    readyEmitted = true
    emit('ready')
}

/**
 * 将 JWT 第二段使用的 base64url 转为标准 base64，便于 atob 解码。
 */
function base64UrlToBase64(b64url: string) {
    const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    if (pad) return `${b64}${'='.repeat(4 - pad)}`
    return b64
}

/**
 * 从 playSign（JWT）中解析 payload（内含 appId 等，供 TCPlayer 初始化 appID）。
 * 解析失败返回 null，调用方需兜底。
 */
function decodeJwtPayload(psign: string): any | null {
    try {
        const parts = psign.split('.')
        if (parts.length < 2) return null
        const payloadB64 = base64UrlToBase64(parts[1])
        const payloadJson = atob(payloadB64)
        return JSON.parse(payloadJson)
    } catch {
        return null
    }
}

/**
 * 从 playSign 的 payload 中取 appID（字段名在不同版本可能为 appId / appID / appid / app_id）。
 */
function decodeAppIdFromPsign(psign: string): string {
    const payload = decodeJwtPayload(psign)
    if (!payload) return ''
    return String(payload.appId ?? payload.appID ?? payload.appid ?? payload.app_id ?? '')
}

/**
 * 销毁播放器并清空 host。
 * 顺序：先清定时器 → dispose（释放内部监听与 video.js 结构）→ 再 innerHTML 清空 host，
 * 避免 TCPlayer 残留节点与父级 Vue 卸载时机冲突。
 */
function disposePlayer() {
    clearFallback()
    try {
        player?.dispose?.()
    } catch {
        // ignore
    }
    player = null
    const host = hostRef.value
    if (host) {
        host.innerHTML = ''
    }
}

onMounted(() => {
    const ep = props.episode
    const appID = decodeAppIdFromPsign(ep.playSign ?? '')
    const host = hostRef.value
    if (!appID || !ep.fileId || !ep.playSign || !host) {
        if (!appID && ep.playSign) console.error('TCPlayer: 无法从 playSign 解析 appID')
        finishReadyOnce()
        return
    }

    // 运行时创建 video，不放进模板：Vue 不跟踪该节点，TCPlayer 对 DOM 的改写不会与 patch 冲突。
    const video = document.createElement('video')
    video.setAttribute('preload', 'auto')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.className = 'drama-preview-tcplayer-video'
    host.appendChild(video)

    player = TCPlayer(video, {
        fileID: ep.fileId,
        appID,
        psign: ep.playSign,
        licenseUrl: tcPlayerLicenseUrl,
        autoplay: false,
        controls: true,
        preload: 'auto',
        posterImage: true,
        bigPlayButton: true,
        reportable: false,
        language: 'zh-CN',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        // 与外层 aspect-ratio 容器配合：避免 vjs-fluid 用 padding-top 撑破高度导致控件被裁掉、画面溢出
        fluid: false,
        controlBar: {
            playToggle: true,
            progressControl: true,
            volumePanel: true,
            currentTimeDisplay: true,
            durationDisplay: true,
            timeDivider: true,
            playbackRateMenuButton: true,
            fullscreenToggle: true,
        },
    })

    player?.on?.('error', (err: unknown) => {
        console.error('TCPlayer error:', { err, fileID: ep.fileId, appID })
    })

    /**
     * 尝试调用播放（部分浏览器需用户手势；失败时静默，避免打断流程）。
     */
    const tryPlay = () => {
        try {
            player?.play?.()
        } catch {
            // ignore
        }
    }

    // 先注册兜底定时器，再在 ready 里 clear：若 ready 同步触发，仍能清掉定时器，避免双 finishReadyOnce。
    fallbackTimer = window.setTimeout(() => {
        fallbackTimer = null
        if (!player) return
        tryPlay()
        finishReadyOnce()
    }, 1500)

    player?.ready?.(() => {
        clearFallback()
        tryPlay()
        finishReadyOnce()
    })
})

onBeforeUnmount(() => {
    disposePlayer()
})
</script>

<style scoped>
.drama-preview-tcplayer-root {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
    box-sizing: border-box;
}
/* video.js 根节点：铺满容器，控件叠在画面底部（勿只写 video，否则 .video-js 尺寸不对会看不到控制栏） */
.drama-preview-tcplayer-root :deep(.video-js) {
    width: 100% !important;
    height: 100% !important;
    padding-top: 0 !important;
    box-sizing: border-box;
}
.drama-preview-tcplayer-root :deep(.video-js video),
.drama-preview-tcplayer-root :deep(video.vjs-tech) {
    width: 100%;
    height: 100%;
    object-fit: contain;
}
</style>

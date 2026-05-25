import { defineStore } from 'pinia'
import TcVod from 'vod-js-sdk-v6'
import { getTxVodUploadSignature } from '@/api'

export type VodTaskStatus = 'queued' | 'uploading' | 'success' | 'error' | 'cancelled'

export type VodUploadTask = {
    /** 关联剧集 id（seresId） */
    episodeId: string
    /** 用于列表展示 */
    fileName: string
    status: VodTaskStatus
    progress: number // 0-100
    errorMsg?: string
    doneResult?: any
    createdAt: number
}

/** 上传完成回调：收到腾讯云回调后调用编辑接口更新 fileId、视频地址，并将 handleStatus 置为 1（处理中） */
export type VodUploadOnDone = (episodeId: string, fileId: string, playUrl: string) => void
/** 上传失败回调：将 handleStatus 置为 -1（上传错误） */
export type VodUploadOnError = (episodeId: string) => void

type InternalTask = VodUploadTask & {
    file: File
    vid: string
    seriesCount: number
    uploader?: any
    onDone?: VodUploadOnDone
    onError?: VodUploadOnError
}

/**
 * 与后端约定：上传签名接口查询参数 sourceContext = 短剧 vid + 集数，下划线连接（例：1234_3）
 */
export function buildTxUploadSignatureSourceContext(vid: string, seriesCount: number): string {
    const v = String(vid ?? '').trim()
    const n = Math.floor(Number(seriesCount))
    const seriesSafe = Number.isFinite(n) ? n : 0
    return `${v}_${seriesSafe}`
}

async function fetchTxVodSignature(sourceContext: string) {
    const res: any = await getTxVodUploadSignature(sourceContext)
    const data = res?.data?.data
    const signature = typeof data === 'string' ? data : data?.signature
    if (!signature) throw new Error('获取上传签名失败')
    return signature
}

function buildRenamedVideoFile(file: File, vid: string, seriesCount: number): File {
    const originalName = file.name || 'video.mp4'
    const dotIdx = originalName.lastIndexOf('.')
    const ext = dotIdx > -1 ? originalName.slice(dotIdx) : ''
    // 生成可读时间：年月日时分秒
    const now = new Date()
    const timeStr = now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, '0') +
        String(now.getDate()).padStart(2, '0') +
        String(now.getHours()).padStart(2, '0') +
        String(now.getMinutes()).padStart(2, '0') +
        String(now.getSeconds()).padStart(2, '0')

    const renamed = `${vid}_第${seriesCount}集_${timeStr}${ext}`
    return new File([file], renamed, {
        type: file.type,
        lastModified: file.lastModified,
    })
}

export const useVodUploadStore = defineStore('vodUpload', {
    state: () => ({
        tasks: {} as Record<string, VodUploadTask>,
        queue: [] as string[],
        runningCount: 0,
        maxConcurrent: 10,
        internals: {} as Record<string, InternalTask>,
    }),
    actions: {
        /** 入队并自动开始；同一 episodeId 只保留一个任务（新任务会覆盖旧任务并取消旧上传） */
        enqueueEpisodeUpload(params: {
            episodeId: string
            file: File
            /** 短剧 vid（剧 id） */
            vid: string
            /** 第几集（对应接口 seriesCount）；与 vid 组成上传签名的 sourceContext：vid_集数 */
            seriesCount: number
            onDone?: VodUploadOnDone
            onError?: VodUploadOnError
        }) {
            const episodeId = String(params.episodeId)
            // 直接重命名本地 File，避免依赖 mediaName 覆盖远端文件名
            const file = buildRenamedVideoFile(params.file, params.vid, params.seriesCount)

            // 若已有任务，先尝试取消
            const existing = this.internals[episodeId]
            if (existing?.uploader?.cancel) {
                try {
                    existing.uploader.cancel()
                } catch {
                    // ignore
                }
            }

            const task: InternalTask = {
                episodeId,
                file,
                vid: params.vid,
                seriesCount: params.seriesCount,
                fileName: file.name,
                status: 'queued',
                progress: 0,
                createdAt: Date.now(),
                onDone: params.onDone,
                onError: params.onError,
            }
            this.internals[episodeId] = task
            this.tasks[episodeId] = { ...task }

            // 重新入队（去重）
            this.queue = this.queue.filter((id) => id !== episodeId)
            this.queue.push(episodeId) // 在队尾加入新任务

            this._drainQueue()
        },

        cancel(episodeId: string) {
            const id = String(episodeId)
            const t = this.internals[id]
            if (t?.uploader?.cancel) {
                try {
                    t.uploader.cancel()
                } catch {
                    // ignore
                }
            }
            if (this.tasks[id]) {
                this.tasks[id] = { ...this.tasks[id], status: 'cancelled' }
            }
            this.queue = this.queue.filter((x) => x !== id)
            delete this.internals[id]
            this._drainQueue()
        },

        getTask(episodeId: string): VodUploadTask | null {
            return this.tasks[String(episodeId)] ?? null
        },

        _syncPublic(task: InternalTask) {
            this.tasks[task.episodeId] = {
                episodeId: task.episodeId,
                fileName: task.fileName,
                status: task.status,
                progress: task.progress,
                errorMsg: task.errorMsg,
                doneResult: task.doneResult,
                createdAt: task.createdAt,
            }
        },

        _drainQueue() {
            while (this.runningCount < this.maxConcurrent && this.queue.length > 0) { // 正在上传的<最大限制数目 且队列还有在等待的
                const nextId = this.queue.shift() // 从队列头部取一个
                if (!nextId) break
                const task = this.internals[nextId]
                if (!task) continue
                if (task.status === 'uploading') continue
                this._startTask(task)// 开始上传
            }
        },

        async _startTask(task: InternalTask) {
            this.runningCount += 1
            task.status = 'uploading'
            task.progress = 0
            task.errorMsg = undefined
            task.doneResult = undefined
            this._syncPublic(task)

            try {
                const signatureSourceContext = buildTxUploadSignatureSourceContext(task.vid, task.seriesCount)
                const getSignature = () => fetchTxVodSignature(signatureSourceContext)
                const tcVod = new (TcVod as any)({ getSignature })
                const uploader = tcVod.upload({
                    mediaFile: task.file,
                    // 已通过重命名 File 固化文件名，这里保留断点续传
                    enableResume: true,
                    // sourceContext 改由 GET /api/file/tx/upload-signature?sourceContext=vid_集数 透传，不再传给 ApplyUploadUGC
                } as any)
                task.uploader = uploader

                uploader.on('media_progress', (info: any) => {
                    const p = Math.round((info?.percent ?? 0) * 100)
                    task.progress = Math.max(0, Math.min(100, p))
                    this._syncPublic(task)
                })

                const done = await uploader.done()
                task.doneResult = done
                task.progress = 100
                task.status = 'success'
                this._syncPublic(task)
                const fileId = done?.fileId ?? ''
                const playUrl = done?.video?.url ?? ''
                if (fileId || playUrl) {
                    try {
                        task.onDone?.(task.episodeId, String(fileId), String(playUrl))
                    } catch (cbErr) {
                        console.error('vod upload onDone callback error', cbErr)
                    }
                }
            } catch (e: any) {
                const msg = e?.message || '上传失败'
                task.errorMsg = msg
                task.status = msg === 'cancel' ? 'cancelled' : 'error'
                this._syncPublic(task)
                if (task.status === 'error') {
                    try {
                        task.onError?.(task.episodeId)
                    } catch (cbErr) {
                        console.error('vod upload onError callback error', cbErr)
                    }
                }
            } finally {
                this.runningCount = Math.max(0, this.runningCount - 1)
                // 释放 uploader 引用
                if (this.internals[task.episodeId]) {
                    this.internals[task.episodeId].uploader = undefined
                }
                this._drainQueue()
            }
        },
    },
})


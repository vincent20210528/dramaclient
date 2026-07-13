import request from '../utils/request'
import axios from 'axios'
import { getFileContentType, getFileExtension } from '@/utils/obsUpload'

export interface GameCategoryItem {
    id: number
    categoryCode?: string
    categoryName: string
    descCn?: string
    descEn?: string
    imageUrl?: string
}

/** 游戏分类分页 POST /api/gameCategory/page */
export const getGameCategoryPage = (data: {
    current: number
    size: number
    categoryName?: string
}) => {
    return request({
        url: '/api/gameCategory/page',
        method: 'post',
        data: {
            current: data.current,
            size: data.size,
            ...(data.categoryName?.trim() && { categoryName: data.categoryName.trim() }),
        },
    })
}

/** 游戏分类全量列表 GET /api/gameCategory/list */
export const getGameCategoryList = () => {
    return request({
        url: '/api/gameCategory/list',
        method: 'get',
    })
}

/** 新增游戏分类 POST /api/gameCategory/add */
export const addGameCategory = (data: {
    categoryName: string
    imageUrl?: string
    descCn?: string
    descEn?: string
}) => {
    return request({
        url: '/api/gameCategory/add',
        method: 'post',
        data: {
            categoryName: data.categoryName,
            ...(data.imageUrl != null && data.imageUrl !== '' && { imageUrl: data.imageUrl }),
            ...(data.descCn != null && data.descCn !== '' && { descCn: data.descCn }),
            ...(data.descEn != null && data.descEn !== '' && { descEn: data.descEn }),
        },
    })
}

/** 更新游戏分类 PUT /api/gameCategory/update */
export const updateGameCategory = (data: {
    id: number
    categoryName: string
    imageUrl?: string
    descCn?: string
    descEn?: string
}) => {
    return request({
        url: '/api/gameCategory/update',
        method: 'put',
        data: {
            id: data.id,
            categoryName: data.categoryName,
            imageUrl: data.imageUrl ?? '',
            ...(data.descCn != null && { descCn: data.descCn }),
            ...(data.descEn != null && { descEn: data.descEn }),
        },
    })
}

/** 删除游戏分类 DELETE /api/gameCategory/delete/{id} */
export const deleteGameCategory = (id: number) => {
    return request({
        url: `/api/gameCategory/delete/${id}`,
        method: 'delete',
    })
}

// ========== 游戏资源管理 ==========

export type GameFileType = 'resource' | 'icon' | 'banner' | 'detail' | 'video'

export interface GameInfoItem {
    id: number
    gameId?: string
    gameName: string
    categoryCode: string
    description?: string
    iconUrl?: string
    status?: number
    bannerUrl?: string
    videoUrl?: string
    detailImages?: string
    languageCode?: string
    rating?: number
    downloadCount?: number
    version?: number
    resourceUrl?: string
    resourceSize?: number
    orientation?: number
    bannerPin?: number
    hotPosition?: number
    popularityScore?: number
    avgRating?: number
    favoriteCount?: number
    createdAt?: string
    updatedAt?: string
}

export type GameInfoPayload = {
    gameName: string
    categoryCode: string
    languageCode: string
    iconUrl: string
    description?: string
    status?: number
    bannerUrl?: string
    videoUrl?: string
    detailImages?: string
    rating?: number
    resourceUrl?: string
    resourceSize?: number
    orientation?: number
    bannerPin?: number
    hotPosition?: number
    popularityScore?: number
}

/** 游戏分页 POST /api/gameInfo/page */
export const getGameInfoPage = (data: {
    current: number
    size: number
    gameName?: string
    categoryCode?: string
    languageCode?: string
    status?: number
    bannerPin?: number
    hotPosition?: number
}) => {
    return request({
        url: '/api/gameInfo/page',
        method: 'post',
        data: {
            current: data.current,
            size: data.size,
            ...(data.gameName?.trim() && { gameName: data.gameName.trim() }),
            ...(data.categoryCode?.trim() && { categoryCode: data.categoryCode.trim() }),
            ...(data.languageCode?.trim() && { languageCode: data.languageCode.trim() }),
            ...(data.status != null && { status: data.status }),
            ...(data.bannerPin != null && { bannerPin: data.bannerPin }),
            ...(data.hotPosition != null && { hotPosition: data.hotPosition }),
        },
    })
}

/** 游戏详情 GET /api/gameInfo/{id} */
export const getGameInfoDetail = (id: number) => {
    return request({
        url: `/api/gameInfo/${id}`,
        method: 'get',
    })
}

/** 新增游戏 POST /api/gameInfo/add */
export const addGameInfo = (data: GameInfoPayload) => {
    return request({
        url: '/api/gameInfo/add',
        method: 'post',
        data,
    })
}

/** 更新游戏 PUT /api/gameInfo/update */
export const updateGameInfo = (data: GameInfoPayload & { id: number }) => {
    return request({
        url: '/api/gameInfo/update',
        method: 'put',
        data,
    })
}

/** 删除游戏 DELETE /api/gameInfo/delete/{id} */
export const deleteGameInfo = (id: number) => {
    return request({
        url: `/api/gameInfo/delete/${id}`,
        method: 'delete',
    })
}

/** 更新 BannerPin PUT /api/gameInfo/updateBannerPin */
export const updateGameBannerPin = (data: { id: number; bannerPin: 0 | 1 }) => {
    return request({
        url: '/api/gameInfo/updateBannerPin',
        method: 'put',
        data,
    })
}

/** 更新热门推荐 PUT /api/gameInfo/updateHotPosition */
export const updateGameHotPosition = (data: { id: number; hotPosition: 0 | 1 }) => {
    return request({
        url: '/api/gameInfo/updateHotPosition',
        method: 'put',
        data,
    })
}

/** 更新上下线状态 PUT /api/gameInfo/updateStatus */
export const updateGameStatus = (data: { id: number; status: 0 | 1 }) => {
    return request({
        url: '/api/gameInfo/updateStatus',
        method: 'put',
        data,
    })
}

/** 获取游戏文件上传地址 POST /api/gameFile/uploadUrl */
export const getGameFileUploadUrl = (data: {
    fileType: GameFileType
    fileExtension: string
    fileContentType: string
}) => {
    return request({
        url: '/api/gameFile/uploadUrl',
        method: 'post',
        data,
    })
}

/** COS 预签名直传游戏文件，返回 fileUrl */
export async function uploadGameFile(file: File, fileType: GameFileType): Promise<string> {
    const fileExtension = getFileExtension(file.name)
    const fileContentType = getFileContentType(file)
    const res: any = await getGameFileUploadUrl({ fileType, fileExtension, fileContentType })
    const data = res?.data?.data ?? res?.data
    if (!data?.preSignedUrl || !data?.fileUrl) {
        throw new Error(res?.data?.message ?? '获取上传地址失败')
    }
    await axios.put(data.preSignedUrl, file, {
        headers: {
            'Content-Type': fileContentType,
            'x-cos-acl': 'public-read',
        },
    })
    return data.fileUrl
}

/** 更新游戏资源地址 PUT /api/gameFile/updateResource */
export const updateGameResource = (data: {
    id: number
    resourceUrl: string
    resourceSize: number
}) => {
    return request({
        url: '/api/gameFile/updateResource',
        method: 'put',
        data,
    })
}

/** 下载游戏资源 GET /api/gameFile/download/{id} */
export const downloadGameResource = (id: number) => {
    return request({
        url: `/api/gameFile/download/${id}`,
        method: 'get',
    })
}

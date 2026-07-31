<template>
    <page-content class="game-ad-placement-page" :title="title">
        <template #bottom>
            <el-card class="list-card" shadow="never">
                <div class="panel-wrap panel-register-wrap">
                    <div class="table-toolbar">
                        <span class="toolbar-tip">广告位 ID 留空则 App 使用本地默认值；插屏/开屏可配置时间间隔、进程内次数与间隔次数</span>
                        <span class="toolbar-actions">
                            <el-icon class="toolbar-icon" @click="loadList"><Refresh /></el-icon>
                        </span>
                    </div>

                    <el-table
                        class="register-table"
                        :data="tableData"
                        v-loading="loading"
                        style="width: 100%"
                    >
                        <el-table-column type="index" label="序号" width="70" align="center" />
                        <el-table-column prop="placementName" label="广告位" min-width="180" align="center" show-overflow-tooltip />
                        <el-table-column prop="placementKey" label="配置键" min-width="160" align="center" show-overflow-tooltip />
                        <el-table-column label="广告单元 ID" min-width="220" align="center" show-overflow-tooltip>
                            <template #default="{ row }">
                                <span>{{ row.placementId || '（使用默认）' }}</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="状态" width="100" align="center">
                            <template #default="{ row }">
                                <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
                                    {{ row.enabled === 1 ? '开启' : '关闭' }}
                                </el-tag>
                            </template>
                        </el-table-column>
                        <el-table-column label="间隔秒数" width="110" align="center">
                            <template #default="{ row }">
                                <span v-if="row.supportFrequency === 1">{{ row.intervalSeconds ?? '—' }}</span>
                                <span v-else class="muted">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="进程内次数" width="110" align="center">
                            <template #default="{ row }">
                                <span v-if="row.supportFrequency === 1">{{ row.intervalCount ?? '—' }}</span>
                                <span v-else class="muted">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column label="间隔次数" width="110" align="center">
                            <template #default="{ row }">
                                <span v-if="row.supportFrequency === 1">{{ row.newIntervalCount ?? '—' }}</span>
                                <span v-else class="muted">—</span>
                            </template>
                        </el-table-column>
                        <el-table-column v-if="canEdit" label="操作" width="120" align="center" fixed="right">
                            <template #default="{ row }">
                                <el-button type="primary" link :icon="Edit" @click="openEditDialog(row)">编辑</el-button>
                            </template>
                        </el-table-column>
                    </el-table>
                </div>
            </el-card>

            <el-dialog
                v-model="dialogVisible"
                title="编辑广告位"
                width="560px"
                align-center
                destroy-on-close
                class="menu-add-dialog"
                @close="resetForm"
            >
                <el-form ref="formRef" :model="form" label-width="120px" class="ad-form">
                    <el-form-item label="广告位">
                        <el-input :model-value="form.placementName" disabled />
                    </el-form-item>
                    <el-form-item label="配置键">
                        <el-input :model-value="form.placementKey" disabled />
                    </el-form-item>
                    <el-form-item label="广告单元 ID">
                        <el-input
                            v-model="form.placementId"
                            placeholder="留空则使用 App 默认广告位"
                            clearable
                        />
                    </el-form-item>
                    <el-form-item label="是否开启">
                        <el-switch
                            v-model="form.enabled"
                            :active-value="1"
                            :inactive-value="0"
                            active-text="开启"
                            inactive-text="关闭"
                        />
                    </el-form-item>
                    <template v-if="form.supportFrequency === 1">
                        <el-form-item label="间隔秒数">
                            <el-input-number
                                v-model="form.intervalSeconds"
                                :min="0"
                                :controls="true"
                                placeholder="0 表示不限制"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-form-item label="进程内次数">
                            <el-input-number
                                v-model="form.intervalCount"
                                :min="0"
                                :controls="true"
                                placeholder="0 表示不限制（进程内最多展示次数）"
                                style="width: 100%"
                            />
                        </el-form-item>
                        <el-form-item label="间隔次数">
                            <el-input-number
                                v-model="form.newIntervalCount"
                                :min="0"
                                :controls="true"
                                placeholder="0 表示不限制"
                                style="width: 100%"
                            />
                        </el-form-item>
                    </template>
                </el-form>
                <template #footer>
                    <el-button @click="dialogVisible = false">取消</el-button>
                    <el-button type="primary" :loading="saving" @click="saveDialog">保存</el-button>
                </template>
            </el-dialog>
        </template>
    </page-content>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Edit, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import {
    getGameAdPlacementList,
    updateGameAdPlacement,
    type GameAdPlacementItem,
} from '@/api/game'
import { hasPerm, PERM_GAME_AD } from '@/utils/permission'

const title = '游戏广告位管理'
const canEdit = computed(() => hasPerm(PERM_GAME_AD.edit) || hasPerm(PERM_GAME_AD.list))

const loading = ref(false)
const saving = ref(false)
const tableData = ref<GameAdPlacementItem[]>([])
const dialogVisible = ref(false)

const form = reactive({
    id: 0,
    placementKey: '',
    placementName: '',
    placementId: '',
    enabled: 1,
    intervalSeconds: undefined as number | undefined,
    intervalCount: undefined as number | undefined,
    newIntervalCount: undefined as number | undefined,
    supportFrequency: 0,
})

async function loadList() {
    loading.value = true
    try {
        const res: any = await getGameAdPlacementList()
        const data = res?.data?.data ?? res?.data
        tableData.value = Array.isArray(data) ? data : []
    } catch (e: any) {
        tableData.value = []
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '加载失败')
    } finally {
        loading.value = false
    }
}

function openEditDialog(row: GameAdPlacementItem) {
    form.id = Number(row.id)
    form.placementKey = row.placementKey
    form.placementName = row.placementName
    form.placementId = row.placementId ?? ''
    form.enabled = row.enabled === 0 ? 0 : 1
    form.intervalSeconds = row.intervalSeconds ?? undefined
    form.intervalCount = row.intervalCount ?? undefined
    form.newIntervalCount = row.newIntervalCount ?? undefined
    form.supportFrequency = row.supportFrequency ?? 0
    dialogVisible.value = true
}

function resetForm() {
    form.id = 0
    form.placementKey = ''
    form.placementName = ''
    form.placementId = ''
    form.enabled = 1
    form.intervalSeconds = undefined
    form.intervalCount = undefined
    form.newIntervalCount = undefined
    form.supportFrequency = 0
}

async function saveDialog() {
    if (!form.id) return
    saving.value = true
    try {
        await updateGameAdPlacement({
            id: form.id,
            placementId: form.placementId ?? '',
            enabled: form.enabled,
            intervalSeconds: form.supportFrequency === 1 ? (form.intervalSeconds ?? 0) : null,
            intervalCount: form.supportFrequency === 1 ? (form.intervalCount ?? 0) : null,
            newIntervalCount: form.supportFrequency === 1 ? (form.newIntervalCount ?? 0) : null,
        })
        ElMessage.success('保存成功')
        dialogVisible.value = false
        await loadList()
    } catch (e: any) {
        ElMessage.error(e?.response?.data?.message ?? e?.message ?? '保存失败')
    } finally {
        saving.value = false
    }
}

onMounted(() => loadList())
</script>

<style scoped>
@import '@/views/drama/contentConfig/panelRegisterList.css';

.toolbar-tip {
    color: #909399;
    font-size: 13px;
}

.muted {
    color: #c0c4cc;
}

.ad-form {
    padding-right: 12px;
}
</style>

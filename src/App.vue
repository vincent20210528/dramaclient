<template>
	<el-config-provider :locale="zhCn">
		<router-view />
	</el-config-provider>
</template>

<script setup lang="ts">
import { ElConfigProvider } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { useThemeStore } from './store/theme';

const theme = useThemeStore();
theme.initTheme();

// 清除旧的维护状态（如果存在）
if (localStorage.getItem('system_maintenance')) {
    localStorage.removeItem('system_maintenance');
}
</script>
<style>
@import './assets/css/main.css';
</style>

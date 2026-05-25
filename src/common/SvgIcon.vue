<template>
    <svg :class="iconClass" aria-hidden="true" :style="iconStyle">
        <use :xlink:href="symbolId" />
    </svg>
</template>

<script setup lang="ts">
import { computed, withDefaults } from 'vue'

interface Props {
    // 图标名称（阿里图标库中的英文名）
    name: string
    // 图标前缀，默认为icon，对应阿里图标库的Symbol前缀设置
    prefix?: string
    // 图标尺寸，支持数字(px)或字符串
    size?: number | string
    // 图标颜色
    color?: string
    // 自定义类名
    className?: string
    // 是否旋转动画
    spin?: boolean
    // 鼠标悬停颜色
    hoverColor?: string
}

const props = withDefaults(defineProps<Props>(), {
    prefix: 'icon',
    size: 16,
    color: 'currentColor',
    className: '',
    spin: false,
})

// 计算symbol标识符
const symbolId = computed(() => `#${props.prefix}-${props.name}`)

// 计算类名
const iconClass = computed(() => {
    const classList = ['svg-icon']
    if (props.className) classList.push(props.className)
    if (props.spin) classList.push('svg-icon-spin')
    if (props.hoverColor) classList.push('svg-icon-hover')
    return classList.join(' ')
})

// 计算样式
const iconStyle = computed(() => {
    const style: Record<string, string> = {}

    if (typeof props.size === 'number') {
        style.width = `${props.size}px`
        style.height = `${props.size}px`
    } else {
        style.width = props.size
        style.height = props.size
    }

    if (props.color && props.color !== 'currentColor') {
        style.color = props.color
    }

    if (props.hoverColor) {
        style['--hover-color'] = props.hoverColor
    }

    return style
})
</script>

<style scoped>
.svg-icon {
    display: inline-block;
    outline: none;
    fill: currentColor;
    transition: color 0.2s ease-in-out;
}

.svg-icon-spin {
    animation: svg-icon-spin 1s infinite linear;
}

.svg-icon-hover:hover {
    color: var(--hover-color);
}

@keyframes svg-icon-spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>

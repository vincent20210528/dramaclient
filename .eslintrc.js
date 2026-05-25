module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:vue/vue3-recommended', // 使用 Vue3 的规则
        'plugin:prettier/recommended', // 确保这是最后一个，用于覆盖格式相关规则
        './.eslintrc-auto-import.json'
    ],
}

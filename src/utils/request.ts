import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { notifyRequestError } from './requestErrorMessage'
// import { isInIframe } from './iframeUtils';
// import { IS_MOCK_IFRAME_TEST } from './config';
import { getBaseURL, getApiTimeout, isDevelopment } from './env'

// 根据运行环境设置 baseURL（开发与生产均使用 .env 中的 VITE_APP_BASE_URL，请求直接发往目标服务）
const getServiceBaseURL = (): string => {
    return getBaseURL()
}

// 创建默认的 axios 实例
const service: AxiosInstance = axios.create({
    baseURL: getServiceBaseURL(),
    timeout: getApiTimeout(),
})

// 通用的请求拦截器
const requestInterceptor = (config: InternalAxiosRequestConfig) => {
    // 判断是否为登录接口（在URL修改之前检查）
    const isLoginRequest = config.url?.includes('/user/login') || config.url?.includes('/login')

    // 获取token（登录接口不使用token）
    const token = localStorage.getItem('token') || localStorage.getItem('agent_token')

    // 如果存在token且不是登录接口，则添加token到header
    if (token && !isLoginRequest) {
        config.headers.Authorization = `Bearer ${token}`
    }

    // 如果是登录接口，确保不添加Authorization头
    if (isLoginRequest) {
        delete config.headers.Authorization
    }

    // 打印请求的真实地址
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url

    return config
}

// 通用的请求错误拦截器
const requestErrorInterceptor = (error: AxiosError) => {
    const message = notifyRequestError(error)
    return Promise.reject(new Error(message))
}

// 通用的响应拦截器
const responseInterceptor = (response: AxiosResponse) => {
    if (response.status === 200) {
        return response
    }
    const message = notifyRequestError({ response } as AxiosError)
    return Promise.reject(new Error(message))
}

// 通用的响应错误拦截器
const responseErrorInterceptor = (error: AxiosError) => {
    const message = notifyRequestError(error)
    return Promise.reject(new Error(message))
}

// 为默认服务添加拦截器
service.interceptors.request.use(requestInterceptor, requestErrorInterceptor)
service.interceptors.response.use(responseInterceptor, responseErrorInterceptor)


// 通用的 request 函数，根据配置自动选择服务实例和请求方法
interface RequestConfig {
    url: string
    method?: 'get' | 'post' | 'put' | 'delete' | 'patch'
    data?: any
    params?: any
    headers?: any
    [key: string]: any
}

const request = <T = any>(config: RequestConfig) => {
    let { url, method = 'get', data, params, ...restConfig } = config

    const axiosInstance = service
    const baseURL = axiosInstance.defaults.baseURL || ''
    const originalBaseURL = getBaseURL() // 获取原始的 VITE_APP_BASE_URL

    // 处理URL拼接问题：
    // 1. 开发环境下，如果baseURL为空（使用代理），需要根据原始baseURL判断使用哪个代理前缀
    //    - 如果原始baseURL包含/serverapi，使用/serverapi前缀
    //    - 如果原始baseURL不包含/serverapi（如本地IP），使用/api前缀
    // 2. 生产环境下，如果baseURL包含/serverapi，去掉url的前导斜杠
    if (isDevelopment() && !baseURL && url.startsWith('/')) {
        // 开发环境：baseURL为空，使用代理
        if (originalBaseURL.includes('/serverapi')) {
            // 如果原始baseURL包含/serverapi，添加/serverapi前缀
            if (!url.startsWith('/serverapi')) {
                url = '/serverapi' + url
            }
        } else {
            // 如果原始baseURL不包含/serverapi（本地IP等），添加/api前缀
            if (!url.startsWith('/api') && !url.startsWith('/serverapi') && !url.startsWith('/gateway')) {
                url = '/api' + url
            }
        }
    } else if (
        (baseURL.endsWith('/serverapi/') || baseURL.endsWith('/serverapi')) &&
        url.startsWith('/') &&
        !url.startsWith('/serverapi')
    ) {
        // 生产环境：baseURL包含/serverapi，去掉url的前导斜杠
        url = url.substring(1) // 去掉前导斜杠
    }

    // 根据 method 调用相应的 axios 方法
    switch (method.toLowerCase()) {
        case 'get':
            return axiosInstance.get(url, { params, ...restConfig })
        case 'post':
            return axiosInstance.post(url, data, { params, ...restConfig })
        case 'put':
            return axiosInstance.put(url, data, { params, ...restConfig })
        case 'delete':
            return axiosInstance.delete(url, { params, ...restConfig })
        case 'patch':
            return axiosInstance.patch(url, data, { params, ...restConfig })
        default:
            return axiosInstance.request({ url, method, data, params, ...restConfig })
    }
}

// 导出默认服务（保持向后兼容）
export default request
export { service }

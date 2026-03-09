import axios from 'axios';

// URL对应API 端口
const request = axios.create({
    baseURL: 'http://localhost:8888',
    timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('course_dao_jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
    (response) => {
        return response.data;
    },
    (error) => {
        console.error('网络请求异常:', error);
        return Promise.reject(error);
    }
);

export default request;

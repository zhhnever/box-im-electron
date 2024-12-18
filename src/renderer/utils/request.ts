import axios from "axios";
import { ElMessage } from "element-plus";
const service = axios.create({
  baseURL: __CONFIG__.BASE_API,
  timeout: 5000,
});

// 设置请求发送之前的拦截器
service.interceptors.request.use(
  (config) => {
    // 设置发送之前数据需要做什么处理
    let accessToken = sessionStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.accessToken = encodeURIComponent(accessToken);
    }
    return config
  },
  (err) => Promise.reject(err)
);

// 设置请求接受拦截器
service.interceptors.response.use(
  async (response) => {
    if (response.data.code == 200) {
      return response.data.data;
    } else if (response.data.code == 400) {
      location.href = "/";
    } else if (response.data.code == 401) {
      console.log("token失效，尝试重新获取")
      let refreshToken = sessionStorage.getItem("refreshToken");
      if (!refreshToken) {
        location.href = "/";
      }
      // 发送请求, 进行刷新token操作, 获取新的token
      const data = await service({
        method: 'post',
        url: '/refreshToken',
        headers: {
          refreshToken: refreshToken
        }
      }).catch(() => {
        location.href = "/";
      })
      // 保存token
      sessionStorage.setItem("accessToken", data.accessToken);
      sessionStorage.setItem("refreshToken", data.refreshToken);
      // 重新发送刚才的请求
      return service(response.config)
    } else {
      ElMessage({
        message: response.data.message,
        type: 'error',
        duration: 1500,
        customClass: 'element-error-message-zindex'
      })
      return Promise.reject(response.data)
    }
  },
  (err) => {
    // 判断请求异常信息中是否含有超时timeout字符串
    if (err.message.includes("timeout")) {
      console.log("错误回调", err);
    }
    if (err.message.includes("Network Error")) {
      console.log("错误回调", err);
    }
    return Promise.reject(err);
  }
);

// 将service抛出去
export default service;

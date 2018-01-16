// * 创建axios实例
let axiosInstance = axios.create({
  params: {},
  timeout: 10000,
  validateStatus: (status) => {
    // 只过滤出2开头的状态，其他状态通通列为失败
    return /^[2,4]\d{2}$/.test(status);
  },
  paramsSerializer: (params) => {
    // 序列化params对象
    return Qs.stringify(params);
  }
});

axiosInstance.defaults.headers.common['X-Custom-Header'] = 'foobar';
// axiosInstance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

axiosInstance.defaults.baseURL = 'http://10.0.0.39:10101';

let httpLib = {};

// * 第一次开启功能时获取Rules
httpLib.getPresetRulesData = function () {
  return axiosInstance({
    method: 'get',
    url: '/rules',
    params: {
      url: window.location.href
    }
  });
}

// * 第一次开启功能时获取Metas
httpLib.getPresetMetasData = function () {
  return axiosInstance({
    method: 'get',
    url: '/metas'
  });
}

// * 提交数据
httpLib.submitData = function (data) {
  return axiosInstance({
    method: 'post',
    url: '/selectors',
    data
  })
};
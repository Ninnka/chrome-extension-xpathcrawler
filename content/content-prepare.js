// * 创建axios实例
let axiosInstance = axios.create({
  // 测试用，全局params，需要覆盖可以在调用的地方覆盖，不需要可以删除
  params: {},
  timeout: 10000,
  // auth: {
  //   username: 'janedoe',
  //   password: 's00pers3cret'
  // },
  // 设置Authorization对象在headers中，优先级最高
  validateStatus: (status) => {
    // 只过滤出2开头的状态，其他状态通通列为失败
    return /^[2,4]\d{2}$/.test(status);
  },
  paramsSerializer: (params) => {
    // 序列化params对象
    console.log('typeof Qs', typeof Qs);
    return Qs.stringify(params);
  }
  // transformRequest: (data) => {
  //   // 请求前对data进行操作
  //   // return data;
  //   return qs.stringify(data);
  // }
  // transformResponse: (data) => {
  //   // 有需要可以对返回的data进行统一操作
  //   return JSON.parse(data);
  // }
});

axiosInstance.defaults.headers.common['X-Custom-Header'] = 'foobar';
// axiosInstance.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';

axiosInstance.defaults.baseURL = 'http://www.faker.com';

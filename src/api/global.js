// src/api/global.js
import request from '../utils/request'

export const globalApi = {
  getInitData() {
    return request({
      url: '/api/global/getInitData',
      method: 'get',
    })
  },
  fileUpload(data) {
    return request({
      url: '/api/file/upload',
      method: 'post',
      data,
    })
  },
  sendCode(data) {
    return request({
      url: '/api/auth/email/sendCode',
      method: 'post',
      data,
    })
  },
  getTest() {
    return request({
      url: '/getTest',
      method: 'get',
    })
  },
}

import request from '@renderer/utils/request'

export function findUserById(id) {
    return request({
        url: `/user/find/${id}`,
        method: 'get'
    })
}

export function getUserInfo() {
    return request({
        url: `/user/self`,
        method: 'get'
    })
}


export function updateUserInfo(data) {
    return request({
        url: `/user/update`,
        method: 'post',
        data
    })
}

export function getUserTerminalOnline(params) {
    return request({
        url: `/user/terminal/online`,
        method: 'get',
        params
    })
}



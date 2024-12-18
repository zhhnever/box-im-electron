import request from '@renderer/utils/request'

export function getFriendList() {
    return request({
        url: `/friend/list`,
        method: 'get'
    })
}
export function addFriend(friendId) {
    return request({
        url: `/friend/add`,
        method: 'post',
        params: {
            friendId
        }
    })
}
/**
 * 删除好友
 * @param id 好友ID
 * @returns 
 */
export function delFriend(id) {
    return request({
        url: `/friend/delete/${id}`,
        method: 'post',
    })
}

/**
 * 搜索好友
 * @param id 
 * @returns 
 */
export function findFriendById(id) {
    return request({
        url: `/friend/find/${id}`,
        method: 'get',
    })
}
/**
 * 更新好友信息
 * @param data 
 * @returns 
 */
export function updateFriendInfoById(data) {
    return request({
        url: `/friend/update`,
        method: 'post',
        data
    })
}
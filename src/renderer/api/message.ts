import request from '@renderer/utils/request'

export function getPrivateOfflineMessage(minId) {
    return request({
        url: `/message/private/pullOfflineMessage?minId=${minId}`,
        method: 'get'
    })
}


export function getGroupOfflineMessage(minId) {
    return request({
        url: `/message/group/pullOfflineMessage?minId=${minId}`,
        method: 'get'
    })
}
/**
 * 上传文件
 * @param data 
 * @returns 
 */
export function uploadFile(data) {
    return request({
        url: `/image/upload`,
        data,
        method: 'post',
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
}
/**
 * 发送图片
 * @param data 
 * @returns 
 */
export function uploadImage(data) {
    return request({
        url: `/image/upload`,
        data,
        method: 'post',
        headers: {
            "Content-Type": "multipart/form-data"
        }
    })
}
/**
 * 撤回发送的信息
 * @param chatType 
 * @param msgId 
 * @returns 
 */
export function recallMessageById(chatType, msgId) {
    return request({
        url: `/message/${chatType}/recall/${msgId}`,
        method: 'post'
    })
}
/**
 * 消息变为已读
 * @returns 
 */
export function setMessageReaded(chatType, targetId) {
    return request({
        url: `/message/${chatType}/readed?friendId=${targetId}`,
        method: 'post'
    })
}
/**
 * 加载已读信息
 * @param fId
 * @returns 
 */
export function loadReadedMessage(fId) {
    return request({
        url: `/message/private/maxReadedId?friendId=${fId}`,
        method: 'get'
    })
}

/**
 * 消息变为已读
 * @returns 
 */
export function sendMessageByType(chatType, data) {
    return request({
        url: `/message/${chatType}/send`,
        method: 'post',
        data
    })
}
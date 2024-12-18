
import request from '@renderer/utils/request'

export function getGroupList() {
    return request({
        url: `/group/list`,
        method: 'get'
    })
}

export function findGroupById(id) {
    return request({
        url: `/group/find/${id}`,
        method: 'get'
    })
}
export function findGroupMembersById(groupId) {
    return request({
        url: `/group/members/${groupId}`,
        method: 'get'
    })
}

export function findReadedUsers(params) {
    return request({
        url: "/message/group/findReadedUsers",
        method: "get",
        params
    })
}


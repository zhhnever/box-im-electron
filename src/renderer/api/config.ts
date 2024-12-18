
import request from '@renderer/utils/request'

export function getSysConfig() {
    return request({
        url: `/system/config`,
        method: 'get'
    })
}

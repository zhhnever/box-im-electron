import Cookies from 'js-cookie'

const TokenKey = 'accessToken'

export function getToken() {
    return Cookies.get(TokenKey)
}

export function setToken(token) {
    return Cookies.set(TokenKey, token)
}

export function removeToken() {
    return Cookies.remove(TokenKey)
}


export function getRefreshToken() {
    return Cookies.get("refreshToken")
}

export function setRefreshToken(token) {
    return Cookies.set("refreshToken", token)
}

export function removeRefreshToken() {
    return Cookies.remove("refreshToken")
}

export function setCookies(key: string, val: any) {
    return Cookies.set(key, val)
}
export function getCookies(key: string) {
    return Cookies.get(key)
}

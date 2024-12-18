import { defineStore } from 'pinia'
export const useUserUiStore = defineStore('ui', {
    state: () => {
        return {
            userUiInfo: { // 用户信息窗口
                show: false,
                user: {},
                pos: {
                    x: 0,
                    y: 0
                }
            },
            fullImage: { // 全屏大图
                show: false,
                url: ""
            }
        }
    },
    getters: {
        getUserUiInfo: (state) => state.userUiInfo,
        getFullImage: (state) => state.fullImage,
    },
    actions: {
        showUserInfoBox(user) {
            this.userInfo.show = true;
            this.userInfo.user = user;
        },
        setUserInfoBoxPos(pos) {
            let w = document.documentElement.clientWidth;
            let h = document.documentElement.clientHeight;
            this.userInfo.pos.x = Math.min(pos.x, w - 350);
            this.userInfo.pos.y = Math.min(pos.y, h - 200);
        },
        closeUserInfoBox() {
            this.userInfo.show = false;
        },
        showFullImageBox(url) {
            this.fullImage.show = true;
            this.fullImage.url = url;
        },
        closeFullImageBox() {
            this.fullImage.show = false;
        }
    }
})

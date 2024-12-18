import { defineStore } from 'pinia'
import { RTC_STATE } from "../../utils/enum"
import { getUserInfo } from "@api/user";
export const useUserStore = defineStore('user', {
    state: () => ({
        userInfo: {
            id: null
        },
        rtcInfo: {
            friend: {},  // 好友信息
            mode: "video", // 模式 video:视频 voice:语音
            state: RTC_STATE.FREE // FREE:空闲  WAIT_CALL:呼叫方等待 WAIT_ACCEPT: 被呼叫方等待接听  CHATING:聊天中 
        }
    }),
    getters: {
        getUser: (state) => state.userInfo,
        getRtcInfo: (state) => state.rtcInfo,
    },
    actions: {
        loadUser() {
            return new Promise((resolve, reject) => {
                getUserInfo().then((userInfo) => {
                    this.userInfo = userInfo
                    resolve(userInfo);
                }).catch((res) => {
                    reject(res);
                });
            })
        },
        setUserInfo(userInfo) {
            this.userInfo = userInfo
        },
        setRtcInfo(rtcInfo) {
            this.rtcInfo = rtcInfo;
        },
        setRtcState(rtcState) {
            this.rtcInfo.state = rtcState;
        },
        clear() {
            this.userInfo = {};
            this.rtcInfo = {
                friend: {},
                mode: "video",
                state: RTC_STATE.FREE
            };
        },
    }
})

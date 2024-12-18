import { defineStore } from 'pinia'
import { getSysConfig } from "@api/config";


export const useConfigStore = defineStore('config', {

    state: () => {
        return {
            webrtc: {}
        }
    },
    actions: {
        setConfig(config) {
            this.webrtc = config.webrtc;
        },
        clear() {
            this.webrtc = {};
        },
        loadConfig() {
            return new Promise((resolve, reject) => {
                getSysConfig().then((config) => {
                    console.log("系统配置", config)
                    this.setConfig(config)
                    resolve(config);
                }).catch((res) => {
                    reject(res);
                });
            })
        }
    }
})

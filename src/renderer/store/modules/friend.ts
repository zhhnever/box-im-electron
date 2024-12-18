import { defineStore } from 'pinia'
import { TERMINAL_TYPE } from "@renderer/utils/enum"
import { getFriendList } from "@api/friend";
import { getUserTerminalOnline } from "@api/user";

export const useFriendStore = defineStore('friend', {
    state: () => {
        return {
            friends: [],
            activeFriend: null,
            timer: null
        }
    },
    actions: {
        setFriends(friends) {
            friends.forEach((f) => {
                f.online = false;
                f.onlineWeb = false;
                f.onlineApp = false;
            })
            this.friends = friends;
        },
        updateFriend(friend) {
            this.friends.forEach((f, index) => {
                if (f.id == friend.id) {
                    // 拷贝属性
                    let online = this.friends[index].online;
                    Object.assign(this.friends[index], friend);
                    this.friends[index].online = online;
                }
            })
        },
        setActiveFriend(idx) {
            this.activeFriend = this.friends[idx];
        },
        removeFriend(idx) {
            if (this.friends[idx] == this.activeFriend) {
                this.activeFriend = null;
            }
            this.friends.splice(idx, 1);
        },
        addFriend(friend) {
            this.friends.push(friend);
        },
        refreshOnlineStatus() {
            let userIds = [];
            if (this.friends.length == 0) {
                return;
            }
            this.friends.forEach((f) => { userIds.push(f.id) });
            getUserTerminalOnline({ userIds: userIds.join(',') }).then((onlineTerminals) => {
                this.setOnlineStatus(onlineTerminals)
            })
            // 30s后重新拉取
            this.timer && clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                this.refreshOnlineStatus()
            }, 30000)
        },
        setOnlineStatus(onlineTerminals) {
            this.friends.forEach((f) => {
                let userTerminal = onlineTerminals.find((o) => f.id == o.userId);
                if (userTerminal) {
                    f.online = true;
                    f.onlineWeb = userTerminal.terminals.indexOf(TERMINAL_TYPE.WEB) >= 0
                    f.onlineApp = userTerminal.terminals.indexOf(TERMINAL_TYPE.APP) >= 0
                } else {
                    f.online = false;
                    f.onlineWeb = false;
                    f.onlineApp = false;
                }
            });
            // 在线的在前面
            this.friends.sort((f1, f2) => {
                if (f1.online && !f2.online) {
                    return -1;
                }
                if (f2.online && !f1.online) {
                    return 1;
                }
                return 0;
            });
        },
        clear() {
            this.timer && clearTimeout(this.timer);
            this.friends = [];
            this.timer = null;
            this.activeFriend = [];
        },
        loadFriend() {
            let context = this
            return new Promise((resolve, reject) => {
                getFriendList().then((friends) => {
                    context.setFriends(friends)
                    context.refreshOnlineStatus()
                    resolve(friends)
                }).catch((err) => {
                    reject(err);
                })
            });
        }
    }

})

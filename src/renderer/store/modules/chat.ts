import { defineStore } from 'pinia'
import localForage from 'localforage';
import { useUserStore } from "./user";

import { MESSAGE_STATUS, MESSAGE_TYPE } from "../../utils/enum"

/* 为了加速拉取离线消息效率，拉取时消息暂时存储到cacheChats,等
待所有离线消息拉取完成后，再统一放至vuex中进行渲染*/
let cacheChats = [];
const userStore = useUserStore()
export const useChatStore = defineStore('chats', {
    state: () => {
        return {
            activeChat: null,
            privateMsgMaxId: 0,
            groupMsgMaxId: 0,
            loadingPrivateMsgState: false,
            loadingGroupMsgState: false,
            chats: []
        }
    },
    actions: {
        initChats(chatsData) {
            this.chats = [];
            this.privateMsgMaxId = chatsData.privateMsgMaxId || 0;
            this.groupMsgMaxId = chatsData.groupMsgMaxId || 0;
            cacheChats = chatsData.chats || [];
            // 防止图片一直处在加载中状态
            cacheChats.forEach((chat) => {
                chat.messages.forEach((msg) => {
                    if (msg.loadStatus == "loading") {
                        msg.loadStatus = "fail"
                    }
                })
            })
        },
        openChat(chatInfo) {
            let chats = this.findChats
            let chat = null;
            for (let idx in chats) {
                if (chats[idx].type == chatInfo.type &&
                    chats[idx].targetId === chatInfo.targetId) {
                    chat = chats[idx];
                    // 放置头部
                    this.moveTop(idx)
                    break;
                }
            }
            // 创建会话
            if (chat == null) {
                chat = {
                    targetId: chatInfo.targetId,
                    type: chatInfo.type,
                    showName: chatInfo.showName,
                    headImage: chatInfo.headImage,
                    lastContent: "",
                    lastSendTime: new Date().getTime(),
                    unreadCount: 0,
                    messages: [],
                    atMe: false,
                    atAll: false,
                    stored: false,
                    delete: false
                };
                chats.unshift(chat);
            }
        },
        setActiveChat(idx) {
            let chats = this.findChats;
            this.activeChat = chats[idx];
        },
        resetUnreadCount(chatInfo) {
            let chats = this.findChats;
            for (let idx in chats) {
                if (chats[idx].type == chatInfo.type &&
                    chats[idx].targetId == chatInfo.targetId) {
                    chats[idx].unreadCount = 0;
                    chats[idx].atMe = false;
                    chats[idx].atAll = false;
                    chats[idx].stored = false;
                    this.saveToStorage()
                    break;
                }
            }
        },
        readedMessage(pos) {
            let chat = this.findChatByFriend(pos.friendId);
            chat.messages.forEach((m) => {
                if (m.id && m.selfSend && m.status < MESSAGE_STATUS.RECALL) {
                    // pos.maxId为空表示整个会话已读
                    if (!pos.maxId || m.id <= pos.maxId) {
                        m.status = MESSAGE_STATUS.READED
                        chat.stored = false;
                    }
                }
            })
            this.saveToStorage()
        },
        removeChat(idx) {
            let chats = this.findChats;
            if (chats[idx] == this.activeChat) {
                this.activeChat = null;
            }
            chats[idx].delete = true;
            chats[idx].stored = false;
            this.saveToStorage()
        },
        removePrivateChat(friendId) {
            let chats = this.findChats;
            for (let idx in chats) {
                if (chats[idx].type == 'PRIVATE' &&
                    chats[idx].targetId === friendId) {
                    this.removeChat(idx)
                    break;
                }
            }
        },
        removeGroupChat(groupId) {
            let chats = this.findChats;
            for (let idx in chats) {
                if (chats[idx].type == 'GROUP' &&
                    chats[idx].targetId === groupId) {
                    this.removeChat(idx)
                    break;
                }
            }
        },
        moveTop(idx) {
            // 加载中不移动，很耗性能
            if (this.isLoading) {
                return;
            }
            if (idx > 0) {
                let chats = this.findChats;
                let chat = chats[idx];
                chats.splice(idx, 1);
                chats.unshift(chat);
                chat.lastSendTime = new Date().getTime();
                chat.stored = false;
                this.saveToStorage()
            }
        },
        insertMessage(msgInfo) {
            let type = msgInfo.groupId ? 'GROUP' : 'PRIVATE';
            // 记录消息的最大id
            if (msgInfo.id && type == "PRIVATE" && msgInfo.id > this.privateMsgMaxId) {
                this.privateMsgMaxId = msgInfo.id;
            }
            if (msgInfo.id && type == "GROUP" && msgInfo.id > this.groupMsgMaxId) {
                this.groupMsgMaxId = msgInfo.id;
            }
            // 如果是已存在消息，则覆盖旧的消息数据
            let chat = this.findChat(msgInfo);
            let message = this.findMessage(chat, msgInfo);
            if (message) {
                Object.assign(message, msgInfo);
                // 撤回消息需要显示
                if (msgInfo.type == MESSAGE_TYPE.RECALL) {
                    chat.lastContent = msgInfo.content;
                }
                chat.stored = false;
                this.saveToStorage()
                return;
            }
            // 插入新的数据
            if (msgInfo.type == MESSAGE_TYPE.IMAGE) {
                chat.lastContent = "[图片]";
            } else if (msgInfo.type == MESSAGE_TYPE.FILE) {
                chat.lastContent = "[文件]";
            } else if (msgInfo.type == MESSAGE_TYPE.AUDIO) {
                chat.lastContent = "[语音]";
            } else if (msgInfo.type == MESSAGE_TYPE.ACT_RT_VOICE) {
                chat.lastContent = "[语音通话]";
            } else if (msgInfo.type == MESSAGE_TYPE.ACT_RT_VIDEO) {
                chat.lastContent = "[视频通话]";
            } else if (msgInfo.type == MESSAGE_TYPE.TEXT ||
                msgInfo.type == MESSAGE_TYPE.RECALL ||
                msgInfo.type == MESSAGE_TYPE.TIP_TEXT) {
                chat.lastContent = msgInfo.content;
            }
            chat.lastSendTime = msgInfo.sendTime;
            chat.sendNickName = msgInfo.sendNickName;
            // 未读加1
            if (!msgInfo.selfSend && msgInfo.status != MESSAGE_STATUS.READED && msgInfo.type != MESSAGE_TYPE.TIP_TEXT) {
                chat.unreadCount++;
            }
            // 是否有人@我
            if (!msgInfo.selfSend && chat.type == "GROUP" && msgInfo.atUserIds &&
                msgInfo.status != MESSAGE_STATUS.READED) {
                let userId = userStore.userInfo?.id;
                if (msgInfo.atUserIds.indexOf(userId) >= 0) {
                    chat.atMe = true;
                }
                if (msgInfo.atUserIds.indexOf(-1) >= 0) {
                    chat.atAll = true;
                }
            }
            // 间隔大于10分钟插入时间显示
            if (!chat.lastTimeTip || (chat.lastTimeTip < msgInfo.sendTime - 600 * 1000)) {
                chat.messages.push({
                    sendTime: msgInfo.sendTime,
                    type: MESSAGE_TYPE.TIP_TIME,
                });
                chat.lastTimeTip = msgInfo.sendTime;
            }
            // 根据id顺序插入，防止消息乱序
            let insertPos = chat.messages.length;
            // 防止 图片、文件 在发送方 显示 在顶端  因为还没存库，id=0
            if (msgInfo.id && msgInfo.id > 0) {
                for (let idx in chat.messages) {
                    if (chat.messages[idx].id && msgInfo.id < chat.messages[idx].id) {
                        insertPos = idx;
                        console.log(`消息出现乱序,位置:${chat.messages.length},修正至:${insertPos}`);
                        break;
                    }
                }
            }
            chat.messages.splice(insertPos, 0, msgInfo);
            chat.stored = false;
            this.saveToStorage()
        },
        updateMessage(msgInfo) {
            // 获取对方id或群id
            let chat = this.findChat(msgInfo);
            let message = this.findMessage(chat, msgInfo);
            if (message) {
                // 属性拷贝
                Object.assign(message, msgInfo);
                chat.stored = false;
                this.saveToStorage()
            }
        },
        deleteMessage(msgInfo) {
            let chat = this.findChat(msgInfo);
            for (let idx in chat.messages) {
                // 已经发送成功的，根据id删除
                if (chat.messages[idx].id && chat.messages[idx].id == msgInfo.id) {
                    chat.messages.splice(idx, 1);
                    break;
                }
                // 正在发送中的消息可能没有id，根据发送时间删除
                if (msgInfo.selfSend && chat.messages[idx].selfSend &&
                    chat.messages[idx].sendTime == msgInfo.sendTime) {
                    chat.messages.splice(idx, 1);
                    break;
                }
            }
            chat.stored = false;
            this.saveToStorage()
        },
        updateChatFromFriend(friend) {
            let chat = this.findChatByFriend(friend.id);
            // 更新会话中的群名和头像
            if (chat && (chat.headImage != friend.headImageThumb ||
                chat.showName != friend.nickName)) {
                chat.headImage = friend.headImageThumb;
                chat.showName = friend.nickName;
                chat.stored = false;
                this.saveToStorage()
            }
        },
        updateChatFromGroup(group) {
            let chat = this.findChatByGroup(group.id);
            if (chat && (chat.headImage != group.headImageThumb ||
                chat.showName != group.showGroupName)) {
                // 更新会话中的群名称和头像
                chat.headImage = group.headImageThumb;
                chat.showName = group.showGroupName;
                chat.stored = false;
                this.saveToStorage()
            }
        },
        loadingPrivateMsg(loading) {
            this.loadingPrivateMsgState = loading;
            if (!this.isLoading) {
                this.refreshChats()
            }
        },
        loadingGroupMsg(loading) {
            this.loadingGroupMsgState = loading;
            if (!this.isLoading) {
                this.refreshChats()
            }
        },
        refreshChats() {
            if (!cacheChats) {
                return;
            }
            // 排序
            cacheChats.sort((chat1, chat2) => {
                return chat2.lastSendTime - chat1.lastSendTime;
            });
            // 将消息一次性装载回来
            this.chats = cacheChats;
            // 清空缓存,不再使用
            cacheChats = null;
            this.saveToStorage()
        },
        saveToStorage() {
            // 加载中不保存，防止卡顿
            if (this.isLoading) {
                return;
            }
            let userId = userStore.userInfo.id;
            let key = "chats-" + userId;
            let chatKeys = [];
            // 按会话为单位存储，
            this.chats.forEach((chat) => {
                // 只存储有改动的会话
                let chatKey = `${key}-${chat.type}-${chat.targetId}`
                if (!chat.stored) {
                    console.log(chatKey)
                    if (chat.delete) {
                        localForage.removeItem(chatKey);
                    } else {
                        let chatJson = JSON.parse(JSON.stringify(chat))

                        localForage.setItem(chatKey, chatJson);
                    }
                    chat.stored = true;
                }
                if (!chat.delete) {
                    chatKeys.push(chatKey);
                }
            })
            // 会话核心信息
            let chatsData = {
                privateMsgMaxId: this.privateMsgMaxId,
                groupMsgMaxId: this.groupMsgMaxId,
                chatKeys: chatKeys
            }
            localForage.setItem(key, chatsData)
            // 清理已删除的会话
            this.chats = this.chats.filter(chat => !chat.delete)
        },
        clear() {
            cacheChats = []
            this.chats = [];
            this.activeChat = null;
        },
        loadChat() {
            return new Promise((resolve, reject) => {
                let userId = userStore.userInfo.id;
                let key = "chats-" + userId;
                localForage.getItem(key).then((chatsData: any) => {
                    if (!chatsData) {
                        resolve(null);
                    } else if (chatsData.chats) {
                        // 兼容旧版本
                        this.initChats(chatsData)
                        resolve(chatsData);
                    } else if (chatsData.chatKeys) {
                        const promises = [];
                        chatsData.chatKeys.forEach(key => {
                            promises.push(localForage.getItem(key))
                        })
                        Promise.all(promises).then(chats => {
                            chatsData.chats = chats.filter(o => o);
                            this.initChats(chatsData)
                            resolve(chatsData);
                        })
                    }
                }).catch((e) => {
                    console.log("加载消息失败")
                    reject();
                })
            })
        }
    },
    getters: {
        isLoading(state) {
            return state.loadingPrivateMsgState || state.loadingGroupMsgState
        },
        findChats(state) {
            if (cacheChats && this.isLoading) {
                return cacheChats;
            }
            return state.chats;
        },
        findChatIdx(state) {
            let chats = this.findChats;
            return (chat) => {
                for (let idx in chats) {
                    if (chats[idx].type == chat.type &&
                        chats[idx].targetId === chat.targetId) {
                        chat = chats[idx];
                        return idx
                    }
                }
            }
        },
        findChat(state) {
            let chats = this.findChats;
            return (msgInfo) => {
                // 获取对方id或群id
                let type = msgInfo.groupId ? 'GROUP' : 'PRIVATE';
                let targetId = msgInfo.groupId ? msgInfo.groupId : msgInfo.selfSend ? msgInfo.recvId : msgInfo.sendId;
                let chat = null;
                for (let idx in chats) {
                    if (chats[idx].type == type &&
                        chats[idx].targetId === targetId) {
                        chat = chats[idx];
                        break;
                    }
                }
                return chat;
            }
        },
        findChatByFriend(state) {
            let chats = this.findChats;
            return (fid) => chats.find(chat => chat.type == 'PRIVATE' &&
                chat.targetId == fid)
        },
        findChatByGroup(state) {
            let chats = this.findChats;
            return (gid) => chats.find(chat => chat.type == 'GROUP' &&
                chat.targetId == gid)
        },
        findMessage: (state) => (chat, msgInfo) => {
            if (!chat) {
                return null;
            }
            for (let idx in chat.messages) {
                // 通过id判断
                if (msgInfo.id && chat.messages[idx].id == msgInfo.id) {
                    return chat.messages[idx];
                }
                // 正在发送中的消息可能没有id,只有tmpId
                if (msgInfo.tmpId && chat.messages[idx].tmpId &&
                    chat.messages[idx].tmpId == msgInfo.tmpId) {
                    return chat.messages[idx];
                }
            }
        }
    }
})
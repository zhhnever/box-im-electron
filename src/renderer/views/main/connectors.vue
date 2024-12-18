<template>
  <el-container class="home-page">
    <el-aside width="60px" class="navi-bar">
      <div class="user-head-image">
        <head-image
          :name="userStore.userInfo.nickName"
          :url="userStore.userInfo.headImageThumb"
          :size="40"
          @click.native="showSettingDialog = true"
        ></head-image>
      </div>
      <el-menu background-color="#E8F2FF" style="margin-top: 25px;">
        <el-menu-item title="聊天">
          <el-badge
            :show-zero="false"
            :value="unreadCount"
            :max="99"
            badge-class="unread-text"
            :offset="[-10, 10]"
          >
            <router-link class="link" v-bind:to="'/home/chat'">
              <span class="icon iconfont icon-comment"></span>
            </router-link>
          </el-badge>
        </el-menu-item>
        <el-menu-item title="好友">
          <router-link class="link" v-bind:to="'/home/friend'">
            <span class="icon iconfont icon-my"></span>
          </router-link>
        </el-menu-item>
        <el-menu-item title="群聊">
          <router-link class="link" v-bind:to="'/home/group'">
            <span class="icon iconfont icon-friend"></span>
          </router-link>
        </el-menu-item>
        <el-menu-item title="设置" @click="showSetting()">
          <span style="width: 100%;" class="icon iconfont icon-more"></span>
        </el-menu-item>
      </el-menu>
      <div class="exit-box" @click="onExit()" title="退出">
        <span class="icon iconfont icon-exit"></span>
      </div>
    </el-aside>
    <el-main class="content-box">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </el-main>
    <setting :visible="showSettingDialog" @close="closeSetting()"></setting>
    <user-info
      v-show="uiStore.userUiInfo.show"
      :pos="uiStore.userUiInfo.pos"
      :user="uiStore.userUiInfo.user"
      @close="uiStore.closeUserInfoBox()"
    ></user-info>
    <full-image
      :visible="uiStore.fullImage.show"
      :url="uiStore.fullImage.url"
      @close="uiStore.closeFullImageBox()"
    ></full-image>
    <!-- <rtc-private-video ref="rtcPrivateVideo"></rtc-private-video> -->
  </el-container>
</template>

<script lang="ts" setup>
import HeadImage from "./components/HeadImage.vue";
import Setting from "./components/Setting.vue";
import UserInfo from "./components/UserInfo.vue";
import FullImage from "./components/FullImage.vue";
// import RtcPrivateVideo from "./components/rtc/RtcPrivateVideo.vue";
// import RtcPrivateAcceptor from "./components/rtc/RtcPrivateAcceptor.vue";
import bus from "vue3-eventbus";
import { MESSAGE_STATUS, MESSAGE_TYPE } from "@renderer/utils/enum";
import * as wsApi from "@api/wssocket";
import { findGroupById } from "@api/group";
import { findFriendById } from "@api/friend";
import {
  isNormal,
  isRtcPrivate,
  isRtcGroup
} from "@renderer/utils/messageType";
import { getPrivateOfflineMessage, getGroupOfflineMessage } from "@api/message";
import { useGroupStore } from "@store/group";
import { useChatStore } from "@store/chat";
import { useIndexStore } from "@store/index";
import { useUserStore } from "@store/user";
import { useFriendStore } from "@store/friend";
import { useUserUiStore } from "@store/ui";

import { ElAlert, ElMessage } from "element-plus";
import { ref, onMounted, computed } from "vue";
import audioURI from "@renderer/assets/audio/tip.wav";
const showSettingDialog = ref(false);
const lastPlayAudioTime = ref(new Date().getTime() - 1000);
const groupStore = useGroupStore();
const indexStore = useIndexStore();
const chatStore = useChatStore();
const userStore = useUserStore();
const friendStore = useFriendStore();
const uiStore = useUserUiStore();

const init = () => {
  //TODO 先关闭视频通话
  //     bus.on("openPrivateVideo", rctInfo => {
  //     // 进入单人视频通话
  //     this.$refs.rtcPrivateVideo.open(rctInfo);
  //   });
  //   bus.$on("openGroupVideo", rctInfo => {
  //     // 进入多人视频通话
  //     this.$refs.rtcGroupVideo.open(rctInfo);
  //   });
  indexStore
    .load()
    .then(() => {
      console.log(userStore);

      // ws初始化
      wsApi.connect(__CONFIG__.WS_API, sessionStorage.getItem("accessToken"));
      wsApi.onConnect(() => {
        // 加载离线消息
        pullPrivateOfflineMessage(chatStore.privateMsgMaxId);
        pullGroupOfflineMessage(chatStore.groupMsgMaxId);
      });
      wsApi.onMessage((cmd, msgInfo) => {
        if (cmd == 2) {
          // 关闭ws
          wsApi.close(3000);
          // 异地登录，强制下线
          ElAlert("您已在其他地方登陆，将被强制下线", "强制下线通知", {
            confirmButtonText: "确定",
            callback: action => {
              location.href = "/";
            }
          });
        } else if (cmd == 3) {
          // 插入私聊消息
          handlePrivateMessage(msgInfo);
        } else if (cmd == 4) {
          // 插入群聊消息
          handleGroupMessage(msgInfo);
        } else if (cmd == 5) {
          // 处理系统消息
          handleSystemMessage(msgInfo);
        }
      });
      wsApi.onClose(e => {
        if (e.code != 3000) {
          // 断线重连
          ElMessage.error("连接断开，正在尝试重新连接...");
          wsApi.reconnect(
            process.env.VUE_APP_WS_URL,
            sessionStorage.getItem("accessToken")
          );
        }
      });
    })
    .catch(e => {
      console.log("初始化失败", e);
    });
};
const pullPrivateOfflineMessage = minId => {
  chatStore.loadingPrivateMsg(true);
  getPrivateOfflineMessage(minId).catch(() => {
    chatStore.loadingPrivateMsg(false);
  });
};
const pullGroupOfflineMessage = minId => {
  chatStore.loadingGroupMsg(true);
  getGroupOfflineMessage(minId).catch(() => {
    chatStore.loadingGroupMsg(false);
  });
};
const handlePrivateMessage = msg => {
  // 消息加载标志
  if (msg.type == MESSAGE_TYPE.LOADING) {
    chatStore.loadingPrivateMsg(JSON.parse(msg.content));
    return;
  }
  // 消息已读处理，清空已读数量
  if (msg.type == MESSAGE_TYPE.READED) {
    chatStore.resetUnreadCount({
      type: "PRIVATE",
      targetId: msg.recvId
    });
    return;
  }
  // 消息回执处理,改消息状态为已读
  if (msg.type == MESSAGE_TYPE.RECEIPT) {
    chatStore.readedMessage({
      friendId: msg.sendId
    });
    return;
  }
  // 标记这条消息是不是自己发的
  msg.selfSend = msg.sendId == userStore.userInfo.id;
  // 单人webrtc 信令
  //   if (isRtcPrivate(msg.type)) {
  //     this.$refs.rtcPrivateVideo.onRTCMessage(msg);
  //     return;
  //   }
  // 好友id
  let friendId = msg.selfSend ? msg.recvId : msg.sendId;
  loadFriendInfo(friendId).then(friend => {
    insertPrivateMessage(friend, msg);
  });
};
const insertPrivateMessage = (friend, msg) => {
  let chatInfo = {
    type: "PRIVATE",
    targetId: friend.id,
    showName: friend.nickName,
    headImage: friend.headImage
  };
  // 打开会话
  chatStore.openChat(chatInfo);
  // 插入消息
  chatStore.insertMessage(msg);
  // 播放提示音
  if (
    !msg.selfSend &&
    isNormal(msg.type) &&
    msg.status != MESSAGE_STATUS.READED
  ) {
    playAudioTip();
  }
};
const handleGroupMessage = msg => {
  // 消息加载标志
  if (msg.type == MESSAGE_TYPE.LOADING) {
    chatStore.loadingGroupMsg(JSON.parse(msg.content));
    return;
  }
  // 消息已读处理
  if (msg.type == MESSAGE_TYPE.READED) {
    // 我已读对方的消息，清空已读数量
    let chatInfo = {
      type: "GROUP",
      targetId: msg.groupId
    };
    chatStore.resetUnreadCount(chatInfo);
    return;
  }
  // 消息回执处理
  if (msg.type == MESSAGE_TYPE.RECEIPT) {
    // 更新消息已读人数
    let msgInfo = {
      id: msg.id,
      groupId: msg.groupId,
      readedCount: msg.readedCount,
      receiptOk: msg.receiptOk
    };
    chatStore.updateMessage(msgInfo);
    return;
  }
  // 标记这条消息是不是自己发的
  msg.selfSend = msg.sendId == userStore.userInfo.id;
  // 群视频信令
  //   if (isRtcGroup(msg.type)) {
  //     this.$nextTick(() => {
  //       this.$refs.rtcGroupVideo.onRTCMessage(msg);
  //     });
  //     return;
  //   }
  loadGroupInfo(msg.groupId).then(group => {
    // 插入群聊消息
    insertGroupMessage(group, msg);
  });
};
const insertGroupMessage = (group, msg) => {
  let chatInfo = {
    type: "GROUP",
    targetId: group.id,
    showName: group.showGroupName,
    headImage: group.headImageThumb
  };
  // 打开会话
  chatStore.openChat(chatInfo);
  // 插入消息
  chatStore.insertMessage(msg);
  // 播放提示音
  if (
    !msg.selfSend &&
    msg.type <= MESSAGE_TYPE.VIDEO &&
    msg.status != MESSAGE_STATUS.READED
  ) {
    playAudioTip();
  }
};
const handleSystemMessage = msg => {
  // 用户被封禁
  if (msg.type == MESSAGE_TYPE.USER_BANNED) {
    wsApi.close(3000);
    ElAlert("您的账号已被管理员封禁,原因:" + msg.content, "账号被封禁", {
      confirmButtonText: "确定",
      callback: action => {
        onExit();
      }
    });
    return;
  }
};
const onExit = () => {
  wsApi.close(3000);
  sessionStorage.removeItem("accessToken");
  location.href = "/";
};
const playAudioTip = () => {
  // 离线消息不播放铃声
  if (chatStore.isLoading) {
    return;
  }
  // 防止过于密集播放
  if (new Date().getTime() - lastPlayAudioTime.value > 1000) {
    lastPlayAudioTime.value = new Date().getTime();
    let audio = new Audio();
    audio.src = audioURI;
    audio.play();
  }
};
const showSetting = () => {
  showSettingDialog.value = true;
};
const closeSetting = () => {
  showSettingDialog.value = false;
};
const loadFriendInfo = id => {
  return new Promise((resolve, reject) => {
    let friend = friendStore.friends.find(f => f.id == id);
    if (friend) {
      resolve(friend);
    } else {
      findFriendById(id).then(friend => {
        friendStore.addFriend(friend);
        resolve(friend);
      });
    }
  });
};
const loadGroupInfo = id => {
  return new Promise((resolve, reject) => {
    let group = groupStore.groups.find(g => g.id == id);
    if (group) {
      resolve(group);
    } else {
      findGroupById(id).then(group => {
        resolve(group);
        groupStore.addGroup(group);
      });
    }
  });
};
onMounted(() => {
  init();
});
const unreadCount = computed(() => {
  let unreadCount = 0;
  let chats = chatStore.chats;
  chats.forEach(chat => {
    if (!chat.delete) {
      unreadCount += chat.unreadCount;
    }
  });
  return unreadCount;
});

// watchEffect(() => {
//   let tip = unreadCount.value > 0 ? `${unreadCount.value}条未读` : "";
// });
</script>
<style scoped lang="scss">
.home-page {
  height: 100%;
  padding-top: 30px;
}
.navi-bar {
  background: #e5e5e5;
  padding: 10px;
  padding-top: 40px;
  .el-menu {
    border: none;
    flex: 1;
    background-color: #e5e5e5;

    .el-menu-item {
      background-color: #e5e5e5;
      border-radius: 10px;
      padding: 0 !important;
      text-align: center;
      margin-bottom: 10px;
      height: 40px;
      &:hover {
        background-color: #dcdcdc;
      }

      .link {
        text-decoration: none;
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        &.router-link-active {
          background-color: #dcdcdc;
          .icon {
            color: #0099ff;
          }
        }
      }
      .el-badge {
        width: 100%;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .icon {
        font-size: 22px;
        font-weight: 500;
        color: #000;
      }
    }
  }
  .unread-text {
    border: none;
    background-color: #f74c30;
    font-size: 10px;
  }
  .exit-box {
    position: absolute;
    width: 40px;
    bottom: 40px;
    text-align: center;

    .icon {
      font-weight: 500;
      font-size: 22px;
    }

    &:hover {
      color: #0099ff;
    }
  }
}

.content-box {
  padding: 0;
  background-color: #f8f8f8;
  color: black;
  text-align: center;
}
</style>
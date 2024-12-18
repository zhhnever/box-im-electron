<template>
  <div class="chat-box" @click="closeRefBox()" @mousemove="readedMessage()">
    <el-container style="height: 100%;">
      <el-header height="44px" class="box-header">
        <span class="chat-title-name">{{ title }}</span>
        <span
          title="群聊信息"
          v-show="props.chat.type == 'GROUP'"
          class="btn-side el-icon-more"
          @click="showSide = !showSide"
        ></span>
        <div class="header-tools">
          <el-tooltip effect="light" content="语音通话" placement="bottom">
            <i title="语音通话" class="icon iconfont icon-phone"></i>
          </el-tooltip>
          <el-tooltip effect="light" content="视频通话" placement="bottom">
            <i title="视频通话" class="icon iconfont icon-record"></i>
          </el-tooltip>
        </div>
      </el-header>
      <el-main style="padding: 0;">
        <el-container style="height: 100%;">
          <el-container class="content-box">
            <el-main class="im-chat-main" id="chatScrollBox" @scroll="onScroll">
              <div class="im-chat-box">
                <ul>
                  <li v-for="(msgInfo, idx) in chat.messages" :key="idx">
                    <chat-message-item
                      v-if="idx >= showMinIdx"
                      @call="onCall(msgInfo.type)"
                      :mine="msgInfo.sendId == mine.id"
                      :headImage="headImage(msgInfo)"
                      :showName="showName(msgInfo)"
                      :msgInfo="msgInfo"
                      :menu="true"
                      :groupMembers="groupMembers"
                      @delete="deleteMessage"
                      @recall="recallMessage"
                    ></chat-message-item>
                  </li>
                </ul>
              </div>
            </el-main>
            <el-footer height="240px" class="im-chat-footer">
              <div class="chat-tool-bar">
                <div
                  title="表情"
                  class="icon iconfont icon-emoji"
                  ref="emotion"
                  @click.stop="showEmotionBox"
                ></div>
                <div title="发送图片">
                  <file-upload
                    ref="imageUpload"
                    :action="'/image/upload'"
                    :maxSize="5 * 1024 * 1024"
                    :fileTypes="['jpeg', 'png', 'jpg', 'webp', 'gif']"
                    @before="onImageBefore"
                    @success="onImageSuccess"
                    @fail="onImageFail"
                    @confirm="onImageConfirm"
                  >
                    <div class="icon iconfont icon-pic" style="font-size: 22px;"></div>
                  </file-upload>
                </div>
                <div title="发送文件">
                  <file-upload
                    ref="fileUpload"
                    :action="'/file/upload'"
                    :maxSize="10 * 1024 * 1024"
                    @confirm="onFileConfirm"
                    @before="onFileBefore"
                    @success="onFileSuccess"
                    @fail="onFileFail"
                  >
                    <div class="icon iconfont icon-file" style="font-size: 22px;"></div>
                  </file-upload>
                </div>
                <div
                  title="回执消息"
                  v-show="chat.type == 'GROUP'"
                  class="icon iconfont icon-receipt"
                  :class="isReceipt ? 'chat-tool-active' : ''"
                  @click="onSwitchReceipt"
                ></div>
                <div title="发送语音" class="icon iconfont icon-sound" @click="showRecordBox()"></div>
                <div
                  title="语音通话"
                  v-show="chat.type == 'PRIVATE'"
                  class="icon iconfont icon-phone"
                  @click="showPrivateVideo('voice')"
                ></div>
                <div
                  title="语音通话"
                  v-show="chat.type == 'GROUP'"
                  class="icon iconfont icon-phone"
                  @click="onGroupVideo()"
                ></div>
                <div
                  title="视频通话"
                  v-show="chat.type == 'PRIVATE'"
                  class="icon iconfont icon-record"
                  @click="showPrivateVideo('video')"
                ></div>
                <div title="聊天记录" class="icon iconfont icon-calendar" @click="showHistoryBox()"></div>
              </div>
              <div v-if="!showRecord" class="send-content-area">
                <ChatInput
                  :ownerId="group.ownerId"
                  ref="chatInputEditor"
                  :group-members="groupMembers"
                  @submit="sendMessage"
                />
                <div class="send-btn-area">
                  <el-button type="primary" size="small" @click="notifySend()">发送</el-button>
                </div>
              </div>
              <div v-else class="send-content-area">
                <chat-record @close="closeRecordBox" @send="onSendRecord"></chat-record>
              </div>
            </el-footer>
          </el-container>
          <el-aside class="chat-group-side-box" width="300px" v-if="showSide">
            <chat-group-side
              :group="group"
              :groupMembers="groupMembers"
              @reload="loadGroup(group.id)"
            ></chat-group-side>
          </el-aside>
        </el-container>
      </el-main>
      <emotion ref="emoBox" @emotion="onEmotion"></emotion>
      <group-member-selector ref="rtcSel" :groupId="group.id" @complete="onInviteOk"></group-member-selector>
      <!-- <rtc-group-join ref="rtcJoin" :groupId="group.id"></rtc-group-join> -->
      <chat-history
        :visible="showHistory"
        :chat="chat"
        :friend="friend"
        :group="group"
        :groupMembers="groupMembers"
        @close="closeHistoryBox"
      ></chat-history>
    </el-container>
    <el-dialog v-model="fileSendDialog" width="300" destroy-on-close :show-close="false">
      <div class="file-box" v-for="item in sendFileList" :key="item.path">
        <span class="file-icon icon iconfont" :class="getIconType(item.name)"></span>
        <div class="file-info">
          <div class="file-name">{{ item.name }}</div>
          <div class="file-size">{{ fileSzieFormat(item.size) }}</div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button
            type="primary"
            :disabled="sendFileList.length == 0"
            @click="confirmSendFile"
          >发送{{ sendFileList.length >0 ?'('+ sendFileList.length+')':''}}</el-button>
          <el-button @click="fileSendDialog = false">取消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import bus from "vue3-eventbus";
import ChatGroupSide from "./ChatGroupSide.vue";
import ChatMessageItem from "./ChatMessageItem.vue";
import FileUpload from "@renderer/components/common/FileUpload.vue";
import Emotion from "@renderer/components/common/Emotion.vue";
import ChatRecord from "./ChatRecord.vue";
import ChatHistory from "./ChatHistory.vue";
import ChatAtBox from "./ChatAtBox.vue";
import GroupMemberSelector from "../group/GroupMemberSelector.vue";
// import RtcGroupJoin from "../rtc/RtcGroupJoin.vue"
import ChatInput from "./ChatInput.vue";
import { MESSAGE_STATUS, MESSAGE_TYPE } from "@renderer/utils/enum";
import { fixLeft, fixTop } from "@renderer/utils/element";

import {
  uploadImage,
  recallMessageById,
  setMessageReaded,
  loadReadedMessage,
  sendMessageByType
} from "@api/message";
import { findGroupById, findGroupMembersById } from "@api/group";
import { findUserById } from "@api/user";

import { useChatStore } from "@store/chat";
import { useGroupStore } from "@store/group";
import { useUserStore } from "@store/user";
import { useFriendStore } from "@store/friend";
import { useConfigStore } from "@store/config";
import {
  reactive,
  toRefs,
  computed,
  watch,
  defineProps,
  nextTick,
  getCurrentInstance,
  onMounted,
  ref
} from "vue";
import { ElMessageBox, ElMessage } from "element-plus";

const { proxy } = getCurrentInstance();
const chatStore = useChatStore();
const groupStore = useGroupStore();
const userStore = useUserStore();
const configStore = useConfigStore();
const friendStore = useFriendStore();

const props = defineProps<{
  chat?: Object;
}>();
const data = reactive({
  friend: {},
  group: {},
  groupMembers: [],
  sendImageUrl: "",
  sendImageFile: "",
  placeholder: "",
  isReceipt: true,
  showRecord: false, // 是否显示语音录制弹窗
  showSide: false, // 是否显示群聊信息栏
  showHistory: false, // 是否显示历史聊天记录
  lockMessage: false, // 是否锁定发送，
  showMinIdx: 0, // 下标低于showMinIdx的消息不显示，否则页面会很卡置
  reqQueue: [],
  isSending: false
});
const {
  friend,
  group,
  groupMembers,
  sendImageUrl,
  sendImageFile,
  placeholder,
  isReceipt,
  showRecord, // 是否显示语音录制弹窗
  showSide, // 是否显示群聊信息栏
  showHistory, // 是否显示历史聊天记录
  lockMessage, // 是否锁定发送，
  showMinIdx, // 下标低于showMinIdx的消息不显示，否则页面会很卡置
  reqQueue,
  isSending
} = toRefs(data);
const fileSendDialog = ref(false);
const sendFileList = ref([]);
const moveChatToTop = () => {
  let chatIdx = chatStore.findChatIdx(props.chat);
  chatStore.moveTop(chatIdx);
};
const closeRefBox = () => {
  proxy.$refs.emoBox.close();
};
const onCall = type => {
  if (type == MESSAGE_TYPE.ACT_RT_VOICE) {
    showPrivateVideo("voice");
  } else if (type == MESSAGE_TYPE.ACT_RT_VIDEO) {
    showPrivateVideo("video");
  }
};
const onSwitchReceipt = () => {
  isReceipt.value = !isReceipt.value;
  refreshPlaceHolder();
};
const onImageConfirm = images => {
  images.forEach(image => {
    let msgInfo = {
      id: 0,
      tmpId: generateId(),
      sendId: mine.value.id,
      content: JSON.stringify({}),
      sendTime: new Date().getTime(),
      selfSend: true,
      type: 1,
      readedCount: 0,
      loadStatus: "loading",
      status: MESSAGE_STATUS.UNSEND
    };
    // 填充对方id
    fillTargetId(msgInfo, props.chat.targetId);
    // 插入消息
    chatStore.insertMessage(msgInfo);
    // 会话置顶
    moveChatToTop();
    // 滚动到底部
    scrollToBottom();
    // 借助file对象保存
    image.msgInfo = msgInfo;
  });
  proxy.$refs.imageUpload.uploadFile(images);
};
const onImageSuccess = (data, file) => {
  let msgInfo = JSON.parse(JSON.stringify(file.msgInfo));
  msgInfo.content = JSON.stringify(data);
  msgInfo.receipt = isReceipt.value;
  sendMessageRequest(msgInfo).then(m => {
    msgInfo.loadStatus = "ok";
    msgInfo.id = m.id;
    isReceipt.value = false;
    chatStore.insertMessage(msgInfo);
  });
};
const onImageFail = (e, file) => {
  let msgInfo = JSON.parse(JSON.stringify(file.msgInfo));
  msgInfo.loadStatus = "fail";
  chatStore.insertMessage(msgInfo);
};
const onImageBefore = file => {};
const confirmSendFile = () => {
  sendFileList.value.forEach(file => {
    let data = {
      name: file.name,
      size: file.size
    };
    let msgInfo = {
      id: 0,
      tmpId: generateId(),
      sendId: mine.value.id,
      content: JSON.stringify(data),
      sendTime: new Date().getTime(),
      selfSend: true,
      type: 2,
      loadStatus: "loading",
      readedCount: 0,
      status: MESSAGE_STATUS.UNSEND
    };
    // 填充对方id
    fillTargetId(msgInfo, props.chat.targetId);
    // 插入消息
    chatStore.insertMessage(msgInfo);
    // 会话置顶
    moveChatToTop();
    // 滚动到底部
    scrollToBottom();
    // 借助file对象透传
    file.msgInfo = msgInfo;
  });
  proxy.$refs.fileUpload.uploadFile(sendFileList.value);
  fileSendDialog.value = false;
};
const onFileConfirm = files => {
  sendFileList.value = files;
  fileSendDialog.value = true;
};
const onFileSuccess = (url, file) => {
  let data = {
    name: file.name,
    size: file.size,
    url: url
  };
  let msgInfo = JSON.parse(JSON.stringify(file.msgInfo));
  msgInfo.content = JSON.stringify(data);
  msgInfo.receipt = isReceipt.value;
  sendMessageRequest(msgInfo).then(m => {
    msgInfo.loadStatus = "ok";
    msgInfo.id = m.id;
    isReceipt.value = false;
    refreshPlaceHolder();
    chatStore.insertMessage(msgInfo);
  });
};
const onFileFail = (e, file) => {
  file.forEach(f => {
    let msgInfo = JSON.parse(JSON.stringify(file.msgInfo));
    msgInfo.loadStatus = "fail";
    chatStore.insertMessage(msgInfo);
  });
};
const onFileBefore = file => {};
const onCloseSide = () => {
  showSide.value = false;
};
const onScrollToTop = () => {
  // 多展示10条信息
  showMinIdx.value = showMinIdx.value > 10 ? showMinIdx.value - 10 : 0;
};
const onScroll = e => {
  let scrollElement = e.target;
  let scrollTop = scrollElement.scrollTop;
  if (scrollTop < 30) {
    // 在顶部,不滚动的情况
    // 多展示20条信息
    showMinIdx.value = showMinIdx.value > 20 ? showMinIdx.value - 20 : 0;
  }
};
const showEmotionBox = e => {
  let left = fixLeft(proxy.$refs.emotion);
  let top = fixTop(proxy.$refs.emotion);
  proxy.$refs.emoBox.open({
    x: left,
    y: top
  });
};
const onEmotion = emoText => {
  proxy.$refs.chatInputEditor.insertEmoji(emoText);
};
const showRecordBox = () => {
  showRecord.value = true;
};
const closeRecordBox = () => {
  showRecord.value = false;
};
const showPrivateVideo = mode => {
  let rtcInfo = {
    mode: mode,
    isHost: true,
    friend: friend.value
  };
  // 通过home.vue打开单人视频窗口
  bus.emit("openPrivateVideo", rtcInfo);
};
const onGroupVideo = () => {
  // 邀请成员发起通话
  let ids = [mine.value.id];
  let maxChannel = configStore.webrtc.maxChannel;
  proxy.$refs.rtcSel.open(maxChannel, ids, ids);
};
const onInviteOk = members => {
  if (members.length < 2) {
    return;
  }
  let userInfos = [];
  members.forEach(m => {
    userInfos.push({
      id: m.userId,
      nickName: m.showNickName,
      headImage: m.headImage,
      isCamera: false,
      isMicroPhone: true
    });
  });
  let rtcInfo = {
    isHost: true,
    groupId: group.value.id,
    inviterId: mine.value.id,
    userInfos: userInfos
  };
  // 通过home.vue打开多人视频窗口
  bus.emit("openGroupVideo", rtcInfo);
};
const showHistoryBox = () => {
  showHistory.value = true;
};
const closeHistoryBox = () => {
  showHistory.value = false;
};
const onSendRecord = data => {
  let msgInfo = {
    content: JSON.stringify(data),
    type: 3,
    receipt: isReceipt.value
  };
  // 填充对方id
  fillTargetId(msgInfo, props.chat.targetId);
  sendMessageRequest(msgInfo).then(m => {
    m.selfSend = true;
    chatStore.insertMessage(msgInfo);
    // 会话置顶
    moveChatToTop();
    // 保持输入框焦点
    proxy.$refs.chatInputEditor.focus();
    // 滚动到底部
    scrollToBottom();
    // 关闭录音窗口
    showRecord.value = false;
    isReceipt.value = false;
    refreshPlaceHolder();
  });
};
const fillTargetId = (msgInfo, targetId) => {
  if (props.chat.type == "GROUP") {
    msgInfo.groupId = targetId;
  } else {
    msgInfo.recvId = targetId;
  }
};
const notifySend = () => {
  proxy.$refs.chatInputEditor.submit();
};
const sendMessage = async fullList => {
  resetEditor();
  readedMessage();
  let sendText = isReceipt.value ? "【回执消息】" : "";
  for (let i = 0; i < fullList.length; i++) {
    let msg = fullList[i];
    switch (msg.type) {
      case "text":
        await sendTextMessage(sendText + msg.content, msg.atUserIds);
        break;
      case "image":
        await sendImageMessage(msg.content.file);
        break;
      case "file":
        await sendFileMessage(msg.content.file);
        break;
    }
  }
};
const sendImageMessage = file => {
  return new Promise((resolve, reject) => {
    onImageBefore(file);
    let formData = new FormData();
    formData.append("file", file);
    uploadImage(formData)
      .then(data => {
        onImageSuccess(data, file);
        resolve();
      })
      .catch(res => {
        onImageFail(res, file);
        reject();
      });
    nextTick(() => proxy.$refs.chatInputEditor.focus());
    scrollToBottom();
  });
};
const sendTextMessage = (sendText, atUserIds) => {
  return new Promise((resolve, reject) => {
    if (!sendText.trim()) {
      reject();
    }
    let msg = {
      content: sendText,
      type: 0,
      atUserIds: "",
      receipt: null
    };
    // 填充对方id
    fillTargetId(msg, props.chat.targetId);
    // 被@人员列表
    if (props.chat.type == "GROUP") {
      msg.atUserIds = atUserIds;
      msg.receipt = isReceipt.value;
    }
    lockMessage.value = true;
    sendMessageRequest(msg)
      .then(m => {
        m.selfSend = true;
        chatStore.insertMessage(m);
        // 会话置顶
        moveChatToTop();
      })
      .finally(() => {
        // 解除锁定
        scrollToBottom();
        isReceipt.value = false;
        resolve();
      });
  });
};
const sendFileMessage = file => {
  return new Promise((resolve, reject) => {
    let check = proxy.$refs.fileUpload.beforeUpload(file);
    if (check) {
      proxy.$refs.fileUpload.onFileUpload({ file });
    }
  });
};
const deleteMessage = msgInfo => {
  ElMessageBox.prompt("确认删除消息?", "删除消息", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    chatStore.deleteMessage(msgInfo);
  });
};
const recallMessage = msgInfo => {
  ElMessageBox.prompt("确认撤回消息?", "撤回消息", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    recallMessageById(props.chat.type.toLowerCase(), msgInfo.id).then(() => {
      ElMessage.success("消息已撤回");
      msgInfo = JSON.parse(JSON.stringify(msgInfo));
      msgInfo.type = 10;
      msgInfo.content = "你撤回了一条消息";
      msgInfo.status = MESSAGE_STATUS.RECALL;
      chatStore.insertMessage(msgInfo);
    });
  });
};
const readedMessage = () => {
  //消息已读
  if (props.chat.unreadCount == 0) {
    return;
  }
  chatStore.resetUnreadCount(props.chat);
  setMessageReaded(
    props.chat.type.toLowerCase(),
    props.chat.targetId
  ).then(() => {});
};
const loadReaded = fId => {
  loadReadedMessage(fId).then(id => {
    chatStore.readedMessage({
      friendId: fId,
      maxId: id
    });
  });
};
const loadGroup = groupId => {
  findGroupById(groupId).then(group => {
    group.value = group;
    groupStore.updateChatFromGroup(group);
    groupStore.updateGroup(group);
  });

  findGroupMembersById(groupId).then(groupMembers => {
    groupMembers.value = groupMembers;
  });
};
const loadFriend = friendId => {
  // 获取对方最新信息
  findUserById(friendId).then(f => {
    friend.value = f;
    chatStore.updateChatFromFriend(f);
    friendStore.updateFriend(f);
  });
};
const showName = msgInfo => {
  if (props.chat.type == "GROUP") {
    let member = groupMembers.value.find(m => m.userId == msgInfo.sendId);
    return member ? member.showNickName : "";
  } else {
    return msgInfo.sendId == mine.value.id
      ? mine.value.nickName
      : props.chat.showName;
  }
};
const headImage = msgInfo => {
  if (props.chat.type == "GROUP") {
    let member = groupMembers.value.find(m => m.userId == msgInfo.sendId);
    return member ? member.headImage : "";
  } else {
    return msgInfo.sendId == mine.value.id
      ? mine.value.headImageThumb
      : props.chat.headImage;
  }
};
const resetEditor = () => {
  nextTick(() => {
    proxy.$refs.chatInputEditor.clear();
    proxy.$refs.chatInputEditor.focus();
  });
};
const scrollToBottom = () => {
  nextTick(() => {
    let div = document.getElementById("chatScrollBox");
    div.scrollTop = div.scrollHeight;
  });
};
const refreshPlaceHolder = () => {
  if (isReceipt.value) {
    placeholder.value = "【回执消息】";
  } else if (proxy.$refs.editBox && proxy.$refs.editBox.innerHTML) {
    placeholder.value = "";
  } else {
    placeholder.value = "聊点什么吧~";
  }
};
const sendMessageRequest = msgInfo => {
  return new Promise((resolve, reject) => {
    // 请求入队列，防止请求"后发先至"，导致消息错序
    reqQueue.value.push({ msgInfo, resolve, reject });
    processReqQueue();
  });
};
const processReqQueue = () => {
  if (reqQueue.value.length && !isSending.value) {
    isSending.value = true;
    const reqData = reqQueue.value.shift();
    sendMessageByType(props.chat.type.toLowerCase(), reqData.msgInfo)
      .then(res => {
        reqData.resolve(res);
      })
      .catch(e => {
        reqData.reject(e);
      })
      .finally(() => {
        isSending.value = false;
        // 发送下一条请求
        processReqQueue();
      });
  }
};
const generateId = () => {
  // 生成临时id
  return (
    String(new Date().getTime()) + String(Math.floor(Math.random() * 1000))
  );
};
const fileSzieFormat = size => {
  if (size > 1024 * 1024) {
    return Math.round(size / 1024 / 1024) + "M";
  }
  if (size > 1024) {
    return Math.round(size / 1024) + "KB";
  }
  return size + "B";
};
const getIconType = fileName => {
  let type = "fujian";
  let ext = fileName.split(".")[1];
  console.log(ext);

  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      type = "tupian";
      break;
    case "mp3":
    case "wav":
    case "aac":
      type = "yinpin";
      break;
    case "mp4":
    case "avi":
    case "mov":
      type = "shipin";
      break;
    case "txt":
      type = "document";
      break;
    case "doc":
    case "docx":
      type = "wendang";
      break;
    case "xls":
    case "xlsx":
      type = "excel";
      break;
    case "pdf":
      type = "pdf";
      break;
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      type = "yasuobao";
      break;
    default:
      type = "fujian";
  }
  return "icon-wenjianleixing-" + type;
};
onMounted(() => {
  let dom = document.getElementById("chatScrollBox");
  dom.addEventListener("scroll", onScroll);
});

const mine = computed(() => {
  return userStore.userInfo;
});
const title = computed(() => {
  let title = props.chat.showName;
  if (props.chat.type == "GROUP") {
    let size = groupMembers.value.filter(m => !m.quit).length;
    title += `(${size})`;
  }
  return title;
});
const messageAction = computed(() => {
  return `/message/${props.chat.type.toLowerCase()}/send`;
});
const unreadCount = computed(() => {
  return props.chat.unreadCount;
});
const messageSize = computed(() => {
  if (!props.chat || !props.chat.messages) {
    return 0;
  }
  return props.chat.messages.length;
});
watch(
  props.chat,
  (newChat, oldChat) => {
    if (
      newChat.targetId > 0 &&
      (!oldChat ||
        newChat.type != oldChat.type ||
        newChat.targetId != oldChat.targetId)
    ) {
      if (props.chat.type == "GROUP") {
        loadGroup(props.chat.targetId);
      } else {
        loadFriend(props.chat.targetId);
        // 加载已读状态
        loadReaded(props.chat.targetId);
      }
      // 滚到底部
      scrollToBottom();
      showSide.value = false;
      // 消息已读
      readedMessage();
      // 初始状态只显示30条消息
      let size = props.chat.messages.length;
      showMinIdx.value = size > 30 ? size - 30 : 0;
      // 重置输入框
      resetEditor();
      // 复位回执消息
      isReceipt.value = false;
      // 更新placeholder
      refreshPlaceHolder();
    }
  },
  {
    immediate: true
  }
);
watch(messageSize, (newSize, oldSize) => {
  if (newSize > oldSize) {
    // 拉至底部
    scrollToBottom();
  }
});
</script>


<style lang="scss" scoped>
.chat-box {
  position: relative;
  width: 100%;
  background: #f2f2f2;
  border-left: #dddddd solid 1px;
  height: 100%;
  :deep(.el-main) {
    height: 100%;
  }
  .box-header {
    padding: 0px 10px;
    background-color: #f2f2f2;
    line-height: 44px;
    font-size: 16px;
    border-bottom: 1px #ddd solid;
    display: flex;
    justify-content: space-between;
    .chat-title-name {
      padding-left: 10px;
    }
    .header-tools {
      display: flex;
      align-items: center;
      width: 100px;
      justify-content: right;
      i {
        cursor: pointer;
        font-size: 24px;
        margin-right: 10px;
        &:hover {
          color: rgb(0, 153, 255);
        }
      }
    }
    .btn-side {
      position: absolute;
      right: 20px;
      line-height: 50px;
      font-size: 25px;
      cursor: pointer;
    }
  }

  .im-chat-main {
    padding: 0;
    background-color: #f2f2f2;

    .im-chat-box {
      > ul {
        padding: 0 20px;

        li {
          list-style-type: none;
        }
      }
    }
  }

  .im-chat-footer {
    display: flex;
    flex-direction: column;
    padding: 0;

    .chat-tool-bar {
      display: flex;
      position: relative;
      width: 100%;
      height: 40px;
      text-align: left;
      box-sizing: border-box;
      border-top: #ccc solid 1px;
      padding: 2px;
      background-color: #f2f2f2;

      > div {
        font-size: 22px !important;
        cursor: pointer;
        color: black;
        line-height: 30px;
        width: 30px;
        height: 30px;
        text-align: center;
        border-radius: 3px;
        margin: 3px 5px;
        color: #000;
        &:hover {
          color: rgb(0, 153, 255);
        }

        &.chat-tool-active {
          color: white;
          background-color: #195ee2;
        }
      }
    }

    .send-content-area {
      position: relative;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: white !important;

      .send-text-area {
        box-sizing: border-box;
        padding: 5px;
        width: 100%;
        flex: 1;
        resize: none;
        font-size: 16px;
        color: black;
        outline: none;

        text-align: left;
        line-height: 30px;

        &:before {
          content: attr(placeholder);
          color: gray;
        }

        .at {
          color: blue;
          font-weight: 600;
        }

        .receipt {
          color: darkblue;
          font-size: 15px;
          font-weight: 600;
        }

        .emo {
          width: 30px;
          height: 30px;
          vertical-align: bottom;
        }
      }

      .send-image-area {
        text-align: left;
        border: #53a0e7 solid 1px;

        .send-image-box {
          position: relative;
          display: inline-block;

          .send-image {
            max-height: 180px;
            border: 1px solid #ccc;
            border-radius: 2%;
            margin: 2px;
          }

          .send-image-close {
            position: absolute;
            padding: 3px;
            right: 7px;
            top: 7px;
            color: white;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            background-color: #aaa;
            border-radius: 50%;
            border: 1px solid #ccc;
          }
        }
      }

      .send-btn-area {
        padding: 10px;
        position: absolute;
        bottom: 0;
        right: 0;
      }
    }
  }

  .chat-group-side-box {
    border: #dddddd solid 1px;
    animation: rtl-drawer-in 0.3s 1ms;
  }
}
:deep(.el-dialog) {
  padding: 0;
}
.file-box {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  min-height: 80px;
  border-radius: 6px;
  padding: 10px 15px;

  .file-info {
    height: 100%;
    text-align: left;
    font-size: 14px;
    display: flex;
    justify-content: space-around;

    flex-direction: column;
    .file-name {
      display: inline-block;
      min-width: 150px;
      max-width: 300px;
      font-size: 14px;
      color: #000000;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .file-size {
      color: #c5c5c5;
      font-size: 11px;
      text-align: left;
      width: 100%;
    }
  }

  .file-icon {
    font-size: 50px;
    margin-left: 10px;
    color: #d42e07;
  }
}
</style>
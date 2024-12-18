<template>
  <div class="chat-msg-item">
    <span
      class="chat-msg-tip"
      v-if="msgInfo.type == MESSAGE_TYPE.RECALL || msgInfo.type == MESSAGE_TYPE.TIP_TEXT"
    >{{ msgInfo.content }}</span>
    <span
      class="chat-msg-tip"
      v-if="msgInfo.type == MESSAGE_TYPE.TIP_TIME"
    >{{ toTimeText(msgInfo.sendTime) }}</span>
    <div class="chat-msg-normal" v-if="isNormalCom" :class="{ 'chat-msg-mine': mine }">
      <div class="head-image">
        <head-image :name="showName" :size="35" :url="headImage" :id="msgInfo.sendId"></head-image>
      </div>
      <div class="chat-msg-content">
        <div v-show="mode == 1 && msgInfo.groupId && !msgInfo.selfSend" class="chat-msg-top">
          <span>{{ showName }}</span>
        </div>
        <div v-show="mode == 2" class="chat-msg-top">
          <span>{{ showName }}</span>
          <span>{{ toTimeText(msgInfo.sendTime) }}</span>
        </div>
        <div class="chat-msg-bottom" @contextmenu.prevent="showRightMenu($event)">
          <div ref="chatMsgBox">
            <span
              class="chat-msg-text"
              v-if="msgInfo.type == MESSAGE_TYPE.TEXT"
              v-html="transform(msgInfo.content)"
            ></span>
            <div class="chat-msg-image" v-if="msgInfo.type == MESSAGE_TYPE.IMAGE">
              <div
                class="img-load-box"
                v-loading="loading"
                element-loading-text="上传中.."
                element-loading-background="rgba(0, 0, 0, 0.4)"
              >
                <img
                  class="send-image"
                  :src="JSON.parse(msgInfo.content).thumbUrl"
                  @click="showFullImageBox()"
                  loading="lazy"
                />
              </div>
              <span
                title="发送失败"
                v-show="loadFail"
                @click="onSendFail"
                class="send-fail el-icon-warning"
              ></span>
            </div>
            <div class="chat-msg-file" v-if="msgInfo.type == MESSAGE_TYPE.FILE">
              <div class="chat-file-box" v-loading="loading">
                <div class="chat-file-info">
                  <el-link
                    class="chat-file-name"
                    target="_blank"
                    :underline="false"
                    type="primary"
                    :href="data.url"
                    :download="data.name"
                  >{{ data.name }}</el-link>
                  <span class="chat-file-icon icon iconfont" :class="fileIcon"></span>
                </div>
                <div class="chat-file-size">
                  <span v-if="!loadFail && mine ">
                    {{ fileSize }}
                    <span style="margin-left: 10px;">已发送</span>
                  </span>
                  <span v-else-if="!loadFail && !mine ">
                    {{ fileSize }}
                    <span style="margin-left: 10px;">已接收</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div
            class="chat-msg-voice"
            v-if="msgInfo.type == MESSAGE_TYPE.AUDIO"
            @click="onPlayVoice()"
          >
            <audio controls :src="JSON.parse(msgInfo.content).url"></audio>
          </div>
          <div class="chat-action chat-msg-text" v-if="isActionCom">
            <span
              v-if="msgInfo.type== MESSAGE_TYPE.ACT_RT_VOICE"
              title="重新呼叫"
              @click="$emit('call')"
              class="iconfont icon-chat-voice"
            ></span>
            <span
              v-if="msgInfo.type== MESSAGE_TYPE.ACT_RT_VIDEO"
              title="重新呼叫"
              @click="$emit('call')"
              class="iconfont icon-chat-video"
            ></span>
            <span>{{msgInfo.content}}</span>
          </div>
          <div class="chat-msg-status" v-if="!isActionCom">
            <span
              class="chat-readed"
              v-show="msgInfo.selfSend && !msgInfo.groupId
						&& msgInfo.status == MESSAGE_STATUS.READED"
            >已读</span>
            <span
              class="chat-unread"
              v-show="msgInfo.selfSend && !msgInfo.groupId
						&& msgInfo.status != MESSAGE_STATUS.READED"
            >未读</span>
          </div>
          <div class="chat-receipt" v-show="msgInfo.receipt" @click="onShowReadedBox">
            <span v-if="msgInfo.receiptOk" class="icon iconfont icon-ok" title="全体已读"></span>
            <span v-else>{{msgInfo.readedCount}}人已读</span>
          </div>
        </div>
      </div>
    </div>
    <right-menu
      v-show="menu && rightMenu.show"
      :pos="rightMenu.pos"
      :items="menuItems"
      @close="rightMenu.show = false"
      @select="onSelectMenu"
    ></right-menu>
    <chat-group-readed ref="chatGroupReadedBox" :msgInfo="msgInfo" :groupMembers="groupMembers"></chat-group-readed>
  </div>
</template>
<script setup lang="ts" name="messageItem">
import { computed, getCurrentInstance, ref, defineProps } from "vue";
import { MESSAGE_STATUS, MESSAGE_TYPE } from "@renderer/utils/enum";
import { isNormal, isAction } from "@renderer/utils/messageType";
import { toTimeText } from "@renderer/utils/date";
import { transform } from "@renderer/utils/emotion";

import HeadImage from "../HeadImage.vue";
import RightMenu from "../RightMenu.vue";
import ChatGroupReaded from "./ChatGroupReaded.vue";
import { ElMessage } from "element-plus";
import { useUserUiStore } from "@store/ui";
const uiStore = useUserUiStore();
const { proxy } = getCurrentInstance();
let audio = new Audio();
const audioPlayState = ref("STOP"),
  rightMenu = ref({
    show: false,
    pos: {
      x: 0,
      y: 0
    }
  });
const props = defineProps<{
  mode?: number;
  mine?: boolean;
  headImage?: string;
  msgInfo?: Object;
  showName?: string;
  groupMembers?: Array<any>;
  menu?: boolean;
}>();
function onSendFail() {
  ElMessage.error("文件发送失败");
}
function showFullImageBox() {
  let imageUrl = JSON.parse(props.msgInfo.content).originUrl;
  if (imageUrl) {
    uiStore.showFullImageBox(imageUrl);
  }
}
function onPlayVoice() {
  audio.src = JSON.parse(props.msgInfo.content).url;
  audio.play();
  audioPlayState.value = "RUNNING";
}
function showRightMenu(e) {
  rightMenu.value.pos = {
    x: e.x,
    y: e.y
  };
  rightMenu.value.show = "true";
}
function onSelectMenu(item) {
  this.$emit(item.key.toLowerCase(), props.msgInfo);
}
function onShowReadedBox() {
  let rect = proxy.$refs.chatMsgBox.getBoundingClientRect();
  proxy.$refs.chatGroupReadedBox.open(rect);
}
const loading = computed(() => {
  return props.msgInfo.loadStatus && props.msgInfo.loadStatus === "loading";
});
const loadFail = computed(() => {
  return props.msgInfo.loadStatus && props.msgInfo.loadStatus === "fail";
});
const data = computed(() => {
  return JSON.parse(props.msgInfo.content);
});
const fileSize = computed(() => {
  let size = data.value.size;
  if (size > 1024 * 1024) {
    return Math.round(size / 1024 / 1024) + "M";
  }
  if (size > 1024) {
    return Math.round(size / 1024) + "KB";
  }
  return size + "B";
});
const menuItems = computed(() => {
  let items = [];
  if (props.msgInfo.selfSend && props.msgInfo.id > 0) {
    items.push({
      key: "RECALL",
      name: "撤回",
      icon: "icon-return"
    });
  }
  if (props.msgInfo.type == MESSAGE_TYPE.FILE) {
    items.push({
      key: "RECALL",
      name: "另存为",
      icon: "icon-pulldown"
    });
    items.push({
      key: "RECALL",
      name: "打开文件夹",
      icon: "icon-file"
    });
  }
  items.push({
    key: "DELETE",
    name: "删除",
    icon: "icon-delete"
  });
  return items;
});
const isActionCom = computed(() => {
  return isAction(props.msgInfo.type);
});
const isNormalCom = computed(() => {
  const type = props.msgInfo.type;
  return isNormal(type) || isAction(type);
});
const getIconType = ext => {
  switch (ext) {
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "bmp":
      ext = "tupian";
    case "mp3":
    case "wav":
    case "aac":
      return "yinpin";
    case "mp4":
    case "avi":
    case "mov":
      return "shipin";
    case "txt":
      return "document";
    case "doc":
    case "docx":
      return "wendang";
    case "xls":
    case "xlsx":
      return "excel";
    case "pdf":
      return "pdf";
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return "yasuobao";
    default:
      return "fujian";
  }
};
const fileIcon = computed(() => {
  let type = "fujian";
  let fileName = JSON.parse(props.msgInfo.content)?.name;
  if (fileName) {
    let ext = fileName.split(",")[1];
    type = getIconType(ext);
  }
  return "icon-wenjianleixing-" + type;
});
//打开文件夹
const openFolder = () => {};
</script>


<style lang="scss">
.chat-msg-item {
  .chat-msg-tip {
    line-height: 20px;
    font-size: 12px;
    color: #a1a1a1;
    background-color: #f6f6f6;
    padding: 5px;
    border-radius: 5px;
  }

  .chat-msg-normal {
    position: relative;
    font-size: 0;
    padding-left: 45px;
    min-height: 50px;
    margin-top: 10px;

    .head-image {
      position: absolute;
      width: 35px;
      height: 35px;
      top: 0;
      left: 0;
    }

    .chat-msg-content {
      text-align: left;

      .send-fail {
        color: #e60c0c;
        font-size: 30px;
        cursor: pointer;
        margin: 0 20px;
      }

      .chat-msg-top {
        display: flex;
        flex-wrap: nowrap;
        color: #333;
        font-size: 14px;
        line-height: 20px;

        span {
          margin-right: 12px;
        }
      }

      .chat-msg-bottom {
        display: inline-block;
        padding-right: 300px;

        .chat-msg-text {
          display: block;
          position: relative;
          line-height: 26px;
          margin-top: 3px;
          padding: 5px 10px;
          background-color: #ffffff;
          border-radius: 10px;
          color: black;
          display: block;
          font-size: 14px;
          text-align: left;
          white-space: pre-wrap;
          word-break: break-all;

          &:after {
            content: "";
            position: absolute;
            left: -10px;
            top: 13px;
            z-index: -1;
            width: 0;
            height: 0;
            border-style: solid dashed dashed;
            border-color: #eee transparent transparent;
            overflow: hidden;
            border-width: 10px;
          }
        }

        .chat-msg-image {
          display: flex;
          flex-wrap: nowrap;
          flex-direction: row;
          align-items: center;

          .send-image {
            min-width: 200px;
            min-height: 150px;
            max-width: 400px;
            max-height: 300px;
            border-radius: 6px;
            cursor: pointer;
          }
        }

        .chat-msg-file {
          display: flex;
          flex-wrap: nowrap;
          flex-direction: row;
          align-items: center;
          cursor: pointer;
          padding-bottom: 5px;

          .chat-file-box {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            min-height: 80px;
            border-radius: 6px;
            background-color: #fff;
            padding: 10px 15px;
            flex-direction: column;
            .chat-file-size {
              color: #c5c5c5;
              font-size: 11px;
              text-align: left;
              height: 20px;
              width: 100%;
              display: flex;
              align-items: center;
              justify-content: space-between;
              .open-folder {
                font-size: 12px;
                float: right;
              }
            }
            .chat-file-info {
              flex: 1;
              height: 100%;
              text-align: left;
              font-size: 14px;
              display: flex;
              justify-content: space-between;

              .chat-file-name {
                display: inline-block;
                min-width: 150px;
                max-width: 300px;
                font-size: 14px;
                color: #000000;
                margin-bottom: 25px;
                white-space: pre-wrap;
                word-break: break-all;
              }
            }

            .chat-file-icon {
              font-size: 40px;
              margin-left: 10px;
              color: #d42e07;
            }
          }

          .send-fail {
            color: #e60c0c;
            font-size: 30px;
            cursor: pointer;
            margin: 0 20px;
          }
        }

        .chat-msg-voice {
          font-size: 14px;
          cursor: pointer;

          audio {
            height: 45px;
            padding: 5px 0;
          }
        }

        .chat-action {
          display: flex;
          align-items: center;

          .iconfont {
            cursor: pointer;
            font-size: 22px;
            padding-right: 8px;
          }
        }

        .chat-msg-status {
          display: block;

          .chat-readed {
            font-size: 9px;
            color: #877f7f;
          }

          .chat-unread {
            font-size: 9px;
            color: #f23c0f;
          }
        }

        .chat-receipt {
          font-size: 13px;
          color: blue;
          cursor: pointer;

          .icon-ok {
            font-size: 20px;
            color: #329432;
          }
        }

        .chat-at-user {
          padding: 2px 5px;
          border-radius: 3px;
          font-weight: 600;
          cursor: pointer;
        }
      }
    }

    &.chat-msg-mine {
      text-align: right;
      padding-left: 0;
      padding-right: 45px;

      .head-image {
        left: auto;
        right: 0;
      }

      .chat-msg-content {
        text-align: right;

        .chat-msg-top {
          flex-direction: row-reverse;

          span {
            margin-left: 12px;
            margin-right: 0;
          }
        }

        .chat-msg-bottom {
          padding-left: 180px;
          padding-right: 0;

          .chat-msg-text {
            margin-left: 10px;
            background-color: #0099ff;
            color: #fff;
            vertical-align: top;

            &:after {
              left: auto;
              right: -10px;
              border-top-color: #0099ff;
            }
          }

          .chat-msg-image {
            flex-direction: row-reverse;
          }

          .chat-msg-file {
            flex-direction: row-reverse;
          }

          .chat-action {
            flex-direction: row-reverse;

            .iconfont {
              transform: rotateY(180deg);
            }
          }
        }
      }
    }
  }
}
</style>
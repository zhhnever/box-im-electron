<template>
  <div
    class="chat-item"
    :class="active ? 'active' : ''"
    @contextmenu.prevent="showRightMenu($event)"
  >
    <div class="chat-left">
      <head-image
        :url="chat.headImage"
        :name="chat.showName"
        :size="45"
        :id="chat.type=='PRIVATE'?chat.targetId:0"
      ></head-image>
    </div>
    <div class="chat-right">
      <div class="chat-name">
        <div class="chat-name-text" :class="active ? 'active' : ''">
          <div>{{chat.showName}}</div>
          <el-tag v-if="chat.type=='GROUP'" size="mini" effect="dark">群</el-tag>
        </div>
        <div class="chat-time-text" :class="active ? 'active' : ''">{{showTime}}</div>
      </div>
      <div class="chat-content">
        <div class="chat-at-text">{{atText}}</div>
        <div class="chat-send-name" v-show="isShowSendName">{{chat.sendNickName+':&nbsp;'}}</div>
        <div
          class="chat-content-text"
          :class="active ? 'active' : ''"
          v-html="transform(chat.lastContent)"
        ></div>
        <el-badge :show-zero="false" :value="chat.unreadCount" :max="99"></el-badge>
      </div>
    </div>
    <right-menu
      v-show="rightMenu.show"
      :pos="rightMenu.pos"
      :items="rightMenu.items"
      @close="rightMenu.show=false"
      @select="onSelectMenu"
    ></right-menu>
  </div>
</template>
<script setup lang="ts" name="">
import { computed, defineEmits, defineProps, ref } from "vue";
import HeadImage from "../HeadImage.vue";
import RightMenu from "../RightMenu.vue";
import { isNormal } from "@renderer/utils/messageType";
import { transform } from "@renderer/utils/emotion";
import { toTimeText } from "@renderer/utils/date";
const props = defineProps<{
  chat?: Object;
  active?: boolean;
  index?: number;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "send", data): void;
}>();
const rightMenu = ref({
  show: false,
  pos: {
    x: 0,
    y: 0
  },
  items: [
    {
      key: "TOP",
      name: "置顶",
      icon: "el-icon-top"
    },
    {
      key: "DELETE",
      name: "删除",
      icon: "el-icon-delete"
    }
  ]
});
function showRightMenu(e) {
  rightMenu.value.pos = {
    x: e.x,
    y: e.y
  };
  rightMenu.value.show = true;
}
function onSelectMenu(item) {
  this.$emit(item.key.toLowerCase(), this.msgInfo);
}
const isShowSendName = computed(() => {
  if (!props.chat.sendNickName) {
    return false;
  }
  let size = props.chat.messages.length;
  if (size == 0) {
    return false;
  }
  // 只有群聊的普通消息需要显示名称
  let lastMsg = props.chat.messages[size - 1];
  return isNormal(lastMsg.type);
});
const showTime = computed(() => {
  return toTimeText(props.chat.lastSendTime, true);
});
const atText = computed(() => {
  if (props.chat.atMe) {
    return "[有人@我]";
  } else if (props.chat.atAll) {
    return "[@全体成员]";
  }
  return "";
});
</script>


<style lang="scss">
.chat-item {
  height: 70px;
  display: flex;
  margin-bottom: 1px;
  position: relative;
  padding: 5px 10px;
  align-items: center;
  background-color: white;
  white-space: nowrap;
  color: #999999;
  cursor: pointer;

  &:hover {
    background-color: #f8faff;
  }

  &.active {
    background-color: #0099ff;
  }

  .chat-left {
    position: relative;
    display: flex;
    width: 45px;
    height: 45x;

    .unread-text {
      position: absolute;
      background-color: #f56c6c;
      right: -5px;
      top: -5px;
      color: white;
      border-radius: 30px;
      padding: 1px 5px;
      font-size: 10px;
      text-align: center;
      white-space: nowrap;
      border: 1px solid #f1e5e5;
    }
  }

  .chat-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    text-align: left;
    overflow: hidden;

    .chat-name {
      display: flex;
      line-height: 25px;
      height: 25px;

      .chat-name-text {
        flex: 1;
        display: flex;
        align-items: center;
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        color: #000;
        &.active {
          color: #fff;
        }
        .el-tag {
          background-color: #2830d3;
          border-radius: 10px;
          border: 0;
          height: 16px;
          line-height: 16px;
          font-size: 10px;
          margin-left: 2px;
          opacity: 0.8;
        }
      }

      .chat-time-text {
        font-size: 10px;
        text-align: right;
        color: #999999;
        white-space: nowrap;
        overflow: hidden;
        padding-left: 10px;

        &.active {
          color: #fff;
        }
      }
    }

    .chat-content {
      display: flex;
      line-height: 22px;

      .chat-at-text {
        color: #c70b0b;
        font-size: 12px;
      }

      .chat-send-name {
        font-size: 13px;
      }

      .chat-content-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 11px;
        &.active {
          color: #fff;
        }
        img {
          width: 20px !important;
          height: 20px !important;
          vertical-align: bottom;
        }
      }
    }
  }
}
</style>
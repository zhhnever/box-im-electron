<template>
  <div
    class="friend-item"
    :class="active ? 'active' : ''"
    @contextmenu.prevent="showRightMenu($event)"
  >
    <div class="friend-avatar">
      <head-image
        :size="45"
        :name="friend.nickName"
        :url="friend.headImage"
        :online="friend.online"
        :grayscale="friend.online?false:true"
      ></head-image>
    </div>
    <div class="friend-info">
      <div class="friend-name">{{ friend.nickName}}</div>
      <div class="friend-online">
        <span>[</span>
        <div class="online-dot" :class="friend.online?'online':'outline'"></div>
        <span>{{title}}</span>
        <span>]</span>
      </div>
    </div>
    <right-menu
      v-show="menu && rightMenu.show"
      :pos="rightMenu.pos"
      :items="rightMenu.items"
      @close="rightMenu.show=false"
      @select="onSelectMenu"
    ></right-menu>
    <slot></slot>
  </div>
</template>

<script setup lang="ts" name="frinedItem">
import { computed, defineEmits, defineProps, ref } from "vue";
import HeadImage from "../HeadImage.vue";
import RightMenu from "../RightMenu.vue";
import { useFriendStore } from "@store/friend";

import online_web from "@renderer/assets/image/online_web.png";
import online_app from "@renderer/assets/image/online_app.png";

const friendStore = useFriendStore();

const props = defineProps<{
  active?: boolean;
  index?: number;
  menu?: boolean;
}>();
const emit = defineEmits<{
  (e: "chat", data: any): void;
  (e: "delete", data: any): void;
}>();

const rightMenu = ref({
  show: false,
  pos: {
    x: 0,
    y: 0
  },
  items: [
    {
      key: "CHAT",
      name: "发送消息",
      icon: "el-icon-chat-dot-round"
    },
    {
      key: "DELETE",
      name: "删除好友",
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
  emit(item.key.toLowerCase(), this.msgInfo);
}
const friend = computed(() => {
  return friendStore.friends[props.index];
});
const title = computed(() => {
  console.log(friend);

  return friend.value.online ? "在线" : "离线";
});
</script>


<style scope lang="scss">
.friend-item {
  height: 70px;
  display: flex;
  position: relative;
  padding: 5px 10px;
  align-items: center;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background-color: #f8f8f8;
  }

  &.active {
    background-color: #0099ff;
    color: #fff;
  }

  .friend-avatar {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 45px;
    height: 45px;
  }

  .friend-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding-left: 10px;
    text-align: left;

    .friend-name {
      font-size: 15px;
      line-height: 30px;
      white-space: nowrap;
      overflow: hidden;
    }

    .friend-online {
      color: #d7d7d7;
      font-size: 12px;
      display: flex;
      align-items: center;
      .online-dot {
        height: 12px;
        width: 12px;
        border-radius: 50%;
        margin: 1px;
      }
      .online {
        background-image: linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%);
      }
      .outline {
        background-image: linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%);
      }
    }
  }
}
</style>
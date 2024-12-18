<template>
  <div class="user-info-mask" @click="$emit('close')">
    <div class="user-info" :style="{left: pos.x+'px',top: pos.y+'px'}" @click.stop>
      <div class="user-info-box">
        <div class="avatar">
          <head-image
            :name="user.nickName"
            :url="user.headImageThumb"
            :size="70"
            :online="user.online"
            radius="10%"
            @click.native="showFullImage()"
          ></head-image>
        </div>
        <div>
          <el-descriptions :column="1" :title="user.userName" class="user-info-items">
            <el-descriptions-item label="昵称">{{ user.nickName }}</el-descriptions-item>
            <el-descriptions-item label="签名">{{ user.signature }}</el-descriptions-item>
          </el-descriptions>
        </div>
      </div>
      <el-divider content-position="center"></el-divider>
      <div class="user-btn-group">
        <el-button v-show="isFriend" type="primary" @click="onSendMessage()">发消息</el-button>
        <el-button v-show="!isFriend" type="primary" @click="onAddFriend()">加为好友</el-button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts" name="userInfo">
import HeadImage from "./HeadImage.vue";
import { computed, defineProps, defineEmits } from "vue";
import { useChatStore } from "@store/chat";
import { useFriendStore } from "@store/friend";
import { useUserUiStore } from "@store/ui";
import { addFriend } from "@api/friend";

import router from "@renderer/router";
import { ElMessage } from "element-plus";
const chatStore = useChatStore();
const friendStore = useFriendStore();
const uiStore = useUserUiStore();

const props = defineProps<{
  user?: Object;
  pos?: Object;
}>();
const emit = defineEmits<{
  (e: "close"): void;
}>();
const onSendMessage = () => {
  let user = props.user;
  let chat = {
    type: "PRIVATE",
    targetId: user.id,
    showName: user.nickName,
    headImage: user.headImage
  };
  chatStore.openChat(chat);
  chatStore.setActiveChat(0);
  if (router.currentRoute != "/home/chat") {
    router.push("/home/chat");
  }
  emit("close");
};
const onAddFriend = () => {
  addFriend({
    friendId: props.user.id
  }).then(data => {
    ElMessage.success("添加成功，对方已成为您的好友");
    let friend = {
      id: props.user.id,
      nickName: props.user.nickName,
      headImage: props.user.headImageThumb,
      online: props.user.online
    };
    chatStore.addFriend(friend);
  });
};
const showFullImage = () => {
  if (props.user.headImage) {
    uiStore.showFullImageBox(props.user.headImage);
  }
};
const isFriend = computed(() => {
  let friends = friendStore.friends;
  let friend = friends.find(f => f.id == props.user.id);
  return friend != undefined;
});
</script>


<style lang="scss">
.user-info-mask {
  background-color: rgba($color: #000000, $alpha: 0);
  position: absolute;
  width: 100%;
  height: 100%;
}

.user-info {
  position: absolute;
  width: 300px;
  background-color: white;
  border: #dddddd solid 1px;
  border-radius: 5px;
  padding: 15px;

  .user-info-box {
    display: flex;
    align-items: center;

    .user-info-items {
      margin-left: 10px;
      white-space: nowrap;
      overflow: hidden;

      .el-descriptions__header {
        margin-bottom: 5px;
      }

      .el-descriptions__title {
        font-size: 18px;
      }

      .el-descriptions-item__cell {
        padding-bottom: 1px;
      }
    }
  }

  .user-btn-group {
    text-align: center;
  }
}
</style>
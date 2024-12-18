<template>
  <el-container class="friend-page">
    <el-aside width="250px" class="friend-list-box">
      <div class="friend-list-header">
        <el-input :prefix-icon="Search" class="search-text" placeholder="搜索" v-model="searchText"></el-input>
        <el-button type="info" :icon="Plus" @click="onShowAddFriend()"></el-button>
        <add-friend :dialogVisible="showAddFriend" @close="onCloseAddFriend"></add-friend>
      </div>
      <el-scrollbar class="friend-list-items">
        <div v-for="(friend,index) in friendStore.friends" :key="index">
          <friend-item
            v-show="friend.nickName.includes(searchText)"
            :index="index"
            :active="friend === friendStore.activeFriend"
            @chat="onSendMessage(friend)"
            @delete="onDelItem(friend,index)"
            @click.native="onActiveItem(friend,index)"
          ></friend-item>
        </div>
      </el-scrollbar>
    </el-aside>
    <el-container class="friend-box">
      <div v-show="userInfo.id">
        <div class="friend-detail">
          <head-image
            class="head-image"
            :size="140"
            :name="userInfo.nickName"
            :url="userInfo.headImage"
            @click.native="showFullImage()"
            radius="10%"
          ></head-image>
          <div>
            <div class="info-item">
              <el-descriptions title="好友信息" class="description" :column="1">
                <el-descriptions-item label="用户名">{{ userInfo.userName }}</el-descriptions-item>
                <el-descriptions-item label="昵称">{{ userInfo.nickName }}</el-descriptions-item>
                <el-descriptions-item label="性别">{{ userInfo.sex==0?"男":"女" }}</el-descriptions-item>
                <el-descriptions-item label="签名">{{ userInfo.signature }}</el-descriptions-item>
              </el-descriptions>
            </div>
            <div class="frient-btn-group">
              <el-button
                v-show="isFriend"
                :icon="Position"
                type="primary"
                @click="onSendMessage(userInfo)"
              >发消息</el-button>
              <el-button
                v-show="!isFriend"
                :icon="Plus"
                type="primary"
                @click="onAddFriend(userInfo)"
              >加为好友</el-button>
              <el-button
                v-show="isFriend"
                :icon="Delete"
                type="danger"
                @click="onDelItem(userInfo,activeIdx)"
              >删除好友</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-container>
  </el-container>
</template>
<script setup lang="ts" name="friend">
import FriendItem from "./components/friend/FriendItem.vue";
import AddFriend from "./components/friend/AddFriend.vue";
import HeadImage from "./components/HeadImage.vue";
import { Plus, Delete, Position } from "@element-plus/icons-vue";

import { findUserById } from "@api/user";
import { addFriend, delFriend, updateFriendInfoById } from "@api/friend";
import { useFriendStore } from "@store/friend";
import { useChatStore } from "@store/chat";
import { useUserUiStore } from "@store/ui";

import { computed, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import router from "@renderer/router";
const friendStore = useFriendStore();
const chatStore = useChatStore();
const uiStore = useUserUiStore();

const searchText = ref("");
const showAddFriend = ref(false);
const activeIdx = ref(-1);
const userInfo = ref({});
function onShowAddFriend() {
  showAddFriend.value = true;
}
function onCloseAddFriend() {
  showAddFriend.value = false;
}
function onActiveItem(friend, idx) {
  friendStore.setActiveFriend(idx);
  activeIdx.value = idx;
  loadUserInfo(friend, idx);
}
function onDelItem(friend, idx) {
  ElMessageBox.prompt(
    `确认删除'${friend.nickName}',并清空聊天记录吗?`,
    "确认解除?",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(() => {
    delFriend(friend.id).then(data => {
      ElMessage.success("删除好友成功");
      friendStore.removeFriend(idx);
      chatStore.removePrivateChat(friend.id);
    });
  });
}
function onAddFriend(user) {
  addFriend(user.id).then(data => {
    ElMessage.success("添加成功，对方已成为您的好友");
    let friend = {
      id: user.id,
      nickName: user.nickName,
      headImage: user.headImage,
      online: user.online
    };
    friendStore.addFriend(friend);
  });
}
function onSendMessage(user) {
  let chat = {
    type: "PRIVATE",
    targetId: user.id,
    showName: user.nickName,
    headImage: user.headImageThumb
  };
  chatStore.openChat(chat);
  chatStore.setActiveChat(0);
  router.push("/home/chat");
}
function showFullImage() {
  if (userInfo.value.headImage) {
    uiStore.showFullImageBox(userInfo.value.headImage);
  }
}
function updateFriendInfo(friend, user, index) {
  // store的数据不能直接修改，深拷贝一份store的数据
  friend = JSON.parse(JSON.stringify(friend));
  friend.headImage = user.headImageThumb;
  friend.nickName = user.nickName;
  updateFriendInfoById(friend).then(() => {
    friendStore.updateFriend(friend);
    chatStore.updateChatFromFriend(user);
  });
}
function loadUserInfo(friend, index) {
  findUserById(friend.id).then(user => {
    userInfo.value = user;
    // 如果发现好友的头像和昵称改了，进行更新
    if (
      user.headImageThumb != friend.headImage ||
      user.nickName != friend.nickName
    ) {
      updateFriendInfo(friend, user, index);
    }
  });
}
const isFriend = computed(() => {
  return friendStore.friends.find(f => f.id == userInfo.value.id);
});
</script>


<style lang="scss" scoped>
.friend-page {
  height: 100%;
  background: white;
  :deep(.el-button--info) {
    height: 28px !important;
    padding: 0px 7px !important;
    margin-left: 10px;
    background-color: #f5f5f5 !important;
    border: none !important;
    color: #acacac;
  }
  .friend-list-box {
    display: flex;
    flex-direction: column;
    background: white;

    .friend-list-header {
      display: flex;
      padding: 0px 15px;
      padding-bottom: 10px;
      line-height: 50px;
      justify-content: space-around;
      :deep(.el-input__wrapper) {
        box-shadow: none;
        height: 28px;
        background-color: #f5f5f5;
      }
      .el-input__inner {
        border-radius: 10px !important;
      }
    }

    .friend-list-items {
      flex: 1;
    }
  }

  .friend-box {
    display: flex;
    flex-direction: column;
    background-color: #f2f2f2;

    .friend-header {
      padding: 3px;
      height: 50px;
      line-height: 50px;
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      background-color: white;
      border-bottom: 1px #ddd solid;
    }

    .friend-detail {
      background-color: white;
      display: flex;
      padding: 50px 80px 20px 80px;
      text-align: center;
      .head-image {
        width: 200px;
        height: 200px;
      }
      .info-item {
        margin-left: 20px;
        background-color: #ffffff;
        border-radius: 10px;
        border: 1px #ddd solid;
      }

      .description {
        padding: 20px 20px 0px 20px;
      }
    }

    .frient-btn-group {
      text-align: left !important;
      padding: 20px;
    }
  }
}
</style>
<template>
  <el-container class="chat-page">
    <el-aside width="250px" class="chat-list-box">
      <div class="chat-list-header">
        <el-input :prefix-icon="Search" class="search-text" placeholder="搜索" v-model="searchText"></el-input>
        <el-button type="info" :icon="Plus"></el-button>
      </div>
      <div
        class="chat-list-loading"
        v-if="chatStore.isLoading"
        v-loading="true"
        element-loading-text="消息接收中..."
        element-loading-spinner="el-icon-loading"
        element-loading-background="#eee"
      >
        <div class="chat-loading-box"></div>
      </div>
      <el-scrollbar class="chat-list-items">
        <div v-for="(chat,index) in chatStore.chats" :key="index">
          <chat-item
            v-show="!chat.delete&&chat.showName.includes(searchText)"
            :chat="chat"
            :index="index"
            @click.native="onActiveItem(index)"
            @delete="onDelItem(index)"
            @top="onTop(index)"
            :active="chat === chatStore.activeChat"
          ></chat-item>
        </div>
      </el-scrollbar>
    </el-aside>
    <el-container class="chat-box">
      <chat-box v-if="chatStore.activeChat" :chat="chatStore.activeChat"></chat-box>
    </el-container>
  </el-container>
</template>
<script setup lang="ts" name="chat">
import { Plus, Search } from "@element-plus/icons-vue";
import ChatItem from "./components/chat/ChatItem.vue";
import ChatBox from "./components/chat/ChatBox.vue";
import { computed, ref } from "vue";
import { useChatStore } from "@store/chat";
const searchText = ref("");
const messageContent = ref("");
const group = ref({});
const groupMembers = ref([]);
const chatStore = useChatStore();

const onActiveItem = index => {
  chatStore.setActiveChat(index);
};
const onDelItem = index => {
  chatStore.removeChat(index);
};
const onTop = chatIdx => {
  chatStore.moveTop(chatIdx);
};
const onShowAddFriend = () => {};
</script>

<style lang="scss" scoped>
.chat-page {
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
  .chat-box {
    background-color: #f2f2f2;
  }
  .chat-list-box {
    display: flex;
    flex-direction: column;
    .chat-list-header {
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

    .chat-list-loading {
      height: 50px;
      background-color: #eee;

      .chat-loading-box {
        height: 100%;
      }
    }

    .chat-list-items {
      flex: 1;
      background: white;
    }
  }
}
</style>
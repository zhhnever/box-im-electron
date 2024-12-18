<template>
  <div class="chat-group-member" :class="active?'active':''" :style="{'height':height+'px'}">
    <div class="member-avatar">
      <head-image :size="headImageSize" :name="member.showNickName" :url="member.headImage"></head-image>
    </div>
    <div class="member-name" :style="{'line-height':height+'px'}">
      <div>{{ member.showNickName }}</div>
    </div>
  </div>
</template>

<script setup lang="ts" name="groupMember">
import { computed } from "vue";
import HeadImage from "../HeadImage.vue";
const props = defineProps<{
  member?: Object;
  height?: number;
  active?: boolean;
}>();
const headImageSize = computed(() => {
  return Math.ceil(props.height * 0.75);
});
</script>


<style lang="scss">
.chat-group-member {
  display: flex;
  margin-bottom: 1px;
  position: relative;
  padding: 0 5px;
  align-items: center;
  background-color: #fafafa;
  white-space: nowrap;
  box-sizing: border-box;

  &:hover {
    background-color: #f8faff;
  }

  &.active {
    background-color: #e8f2ff;
  }

  .member-name {
    padding-left: 10px;
    height: 100%;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    font-size: 14px;
    font-weight: 600;
  }
}
</style>

<template>
  <div class="group-member-item" :style="{'height':height+'px'}">
    <div class="member-avatar">
      <head-image
        :size="headImageSize"
        :name="member.showNickName"
        :url="member.headImage"
        :online="member.online"
      ></head-image>
    </div>
    <div class="member-name" :style="{'line-height':height+'px'}">
      <div>{{ member.showNickName }}</div>
    </div>
    <slot></slot>
  </div>
</template>
<script setup lang="ts" name="groupMember">
import { computed, defineProps } from "vue";
import HeadImage from "../HeadImage.vue";
const props = defineProps<{
  member?: any;
  height?: number;
}>();
const headImageSize = computed(() => {
  return Math.ceil(props.height * 0.75);
});
</script>


<style lang="scss">
.group-member-item {
  display: flex;
  margin-bottom: 1px;
  position: relative;
  padding: 0 15px;
  align-items: center;
  background-color: #fafafa;
  white-space: nowrap;
  box-sizing: border-box;

  &:hover {
    background-color: #eeeeee;
  }

  &.active {
    background-color: #eeeeee;
  }

  .member-name {
    flex: 1;
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

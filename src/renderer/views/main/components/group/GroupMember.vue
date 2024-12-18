<template>
  <div class="group-member">
    <head-image
      :id="member.userId"
      :name="member.showNickName"
      :url="member.headImage"
      :size="50"
      :online="member.online"
    >
      <div v-if="showDel" @click.stop="onDelete()" class="btn-kick el-icon-error"></div>
    </head-image>
    <div class="member-name">{{member.showNickName}}</div>
  </div>
</template>
<script setup lang="ts" name="groupMember">
import { defineEmits, defineProps } from "vue";
import HeadImage from "../HeadImage.vue";
const emit = defineEmits<{
  (e: "del", data): void;
}>();
const props = defineProps<{
  member?: Object;
  showDel?: boolean;
}>();
const onDelete = () => {
  emit("del", props.member);
};
</script>


<style lang="scss">
.group-member {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 50px;
  .member-name {
    font-size: 12px;
    text-align: center;
    width: 100%;
    height: 30px;
    line-height: 30px;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .btn-kick {
    display: none;
    position: absolute;
    right: -8px;
    top: -8px;
    color: darkred;
    font-size: 20px;
    cursor: pointer;
  }

  &:hover .btn-kick {
    display: block;
    color: #ce1818;
  }
}
</style>

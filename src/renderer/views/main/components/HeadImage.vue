<template>
  <div class="head-image" :class="grayscale? 'outline-wrapper':''" @click="showUserInfo($event)">
    <img class="avatar-image" :src="avatarUrl" :style="avatarImageStyle" loading="lazy" />
    <slot></slot>
  </div>
</template>

<script lang="ts" setup name="headImage">
import { computed, defineProps } from "vue";
import { findUserById } from "@api/user";
import { useUserUiStore } from "@store/ui";
import avatarImg from "@renderer/assets/avt.png";
const userUiStore = useUserUiStore();
const props = defineProps({
  id: Number,
  size: Number,
  width: Number,
  height: Number,
  radius: String,
  url: String,
  name: String,
  online: String,
  grayscale: { type: Boolean, default: false }
});

const avatarImageStyle = computed(() => {
  let w = props.width ? props.width : props.size;
  let h = props.height ? props.height : props.size;
  return `width:${w}px; height:${h}px;
					border-radius: ${props.radius};`;
});
const avatarUrl = computed(() => {
  return props.url || avatarImg;
});
const showUserInfo = e => {
  if (props.id && props.id > 0) {
    findUserById(props.id).then(user => {
      userUiStore.setUserInfoBoxPos(e);
      userUiStore.showUserInfoBox(user);
    });
  }
};
</script>

<style scoped lang="scss">
.outline-wrapper {
  &::before {
    border-radius: 50%;
    content: "";
    z-index: 10;
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e7e7e791; /* 黑色半透明效果，可以调整透明度 */
  }
}
.head-image {
  position: relative;
  cursor: pointer;
  border-radius: 50%;
  background-color: white;

  .avatar-image {
    position: relative;
    overflow: hidden;
    display: block;
    border-radius: 50%;
  }

  .avatar-text {
    color: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
  }

  .online {
    position: absolute;
    right: -5px;
    bottom: 0;
    width: 12px;
    height: 12px;
    background: limegreen;
    border-radius: 50%;
    border: 3px solid white;
  }
}
</style>

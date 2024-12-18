
<template>
  <div class="right-menu-mask" @click="close()" @contextmenu.prevent="close()">
    <div class="right-menu" :style="{'left':pos.x+'px','top':pos.y+'px'}">
      <el-menu text-color="#333333">
        <el-menu-item
          v-for="(item) in items"
          :key="item.key"
          :title="item.name"
          @click.native.stop="onSelectMenu(item)"
        >
          <span class="menu-icon icon iconfont" :class="item.icon"></span>
          <span>{{item.name}}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<script setup lang="ts" name="rightMenu">
import { defineEmits, defineProps } from "vue";
const props = defineProps<{
  pos?: Object;
  items?: Array<any>;
}>();
const emit = defineEmits<{
  (e: "close"): void;
  (e: "select", data): void;
}>();
function close() {
  emit("close");
}
function onSelectMenu(item) {
  emit("select", item);
  close();
}
</script>


<style lang="scss" scoped>
.right-menu-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

.right-menu {
  position: fixed;
  box-shadow: 0px 0px 10px #ccc;
  backdrop-filter: blur(10px);
  border-radius: 7px;

  .el-menu {
    border-radius: 7px;
    overflow: hidden;
    background-color: #ffffffe8;
    .el-menu-item {
      height: 35px;
      line-height: 35px;
      padding: 0px 10px;
      font-size: 13px;
      &:hover {
        background-color: #f3f3f3;
      }
      .menu-icon {
        margin-right: 5px;
      }
    }
  }
}
</style>
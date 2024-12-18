<template>
  <div v-show="show" @click="close()">
    <div class="emotion-box" :style="{'left':x+'px','top':y+'px'}">
      <el-scrollbar style="height:250px">
        <div class="emotion-item-list">
          <div
            class="emotion-item"
            v-for="(emoText, i) in emoTextList"
            :key="i"
            @click="onClickEmo(emoText)"
            v-html="textToImg(emoText)"
          ></div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>
<script setup lang="ts" name="emotion">
import { computed, defineEmits, ref, defineExpose } from "vue";
import { emoTextList, textToImg } from "@renderer/utils/emotion";

const emit = defineEmits<{
  (e: "emotion", emotion): void;
}>();
const show = ref(false);
const pos = ref({
  x: 0,
  y: 0
});
const onClickEmo = emoText => {
  let emotion = `#${emoText};`;
  emit("emotion", emotion);
};
const open = p => {
  pos.value = p;
  console.log(p);
  show.value = true;
};
const close = () => {
  show.value = false;
};
const x = computed(() => {
  return pos.value.x;
});
const y = computed(() => {
  return pos.value.y - 270;
});
defineExpose({
  open,
  focus,
  close
});
</script>

<style scoped lang="scss">
.emotion-box {
  position: fixed;
  width: 500px;
  box-sizing: border-box;
  padding: 5px;
  border: 1px solid #53a0e79c;
  border-radius: 5px;
  background-color: #f5f5f5;
  box-shadow: 0px 0px 10px #ccc;

  .emotion-item-list {
    display: flex;
    flex-wrap: wrap;

    .emotion-item {
      text-align: center;
      cursor: pointer;
      padding: 5px;
    }
  }
}
</style>
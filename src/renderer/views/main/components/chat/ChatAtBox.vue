<template>
  <el-scrollbar
    v-show="show&&showMembers.length"
    ref="scrollBox"
    class="group-member-choose"
    :style="{'left':pos.x+'px','top':pos.y-300+'px'}"
  >
    <div v-for="(member,idx) in showMembers" :key="member.id">
      <chat-group-member
        :member="member"
        :height="40"
        :active="activeIdx==idx"
        @click.native="onSelectMember(member)"
      ></chat-group-member>
    </div>
  </el-scrollbar>
</template>
<script setup lang="ts" name="chatAtBox">
import ChatGroupMember from "./ChatGroupMember.vue";
import {
  ref,
  watch,
  defineProps,
  defineEmits,
  getCurrentInstance,
  computed,
  defineExpose
} from "vue";
import { useUserStore } from "@store/user";

const userStore = useUserStore();

const { proxy } = getCurrentInstance();
const props = defineProps<{
  searchText?: string;
  ownerId?: number;
  members?: Array<any>;
}>();
const emit = defineEmits<{
  (e: "select", member): void;
}>();
const show = ref(false);
const activeIdx = ref(0);
const showMembers = ref([]);
const pos = ref({
  x: 0,
  y: 0
});

const init = () => {
  proxy.$refs.scrollBox.wrap.scrollTop = 0;
  showMembers.value = [];
  let userId = userStore.userInfo.id;
  let name = "全体成员";
  if (props.ownerId == userId && name.startsWith(props.searchText)) {
    showMembers.value.push({
      userId: -1,
      showNickName: name
    });
  }
  props.members.forEach(m => {
    if (
      m.userId != userId &&
      !m.quit &&
      m.showNickName.startsWith(props.searchText)
    ) {
      showMembers.value.push(m);
    }
  });
  activeIdx.value = showMembers.value.length > 0 ? 0 : -1;
};
const open = pos => {
  show.value = true;
  pos.value = pos;
  init();
};
const close = () => {
  show.value = false;
};
const moveUp = () => {
  if (activeIdx.value > 0) {
    activeIdx.value--;
    scrollToActive();
  }
};
const moveDown = () => {
  if (activeIdx.value < showMembers.value.length - 1) {
    activeIdx.value++;
    scrollToActive();
  }
};
const select = () => {
  if (activeIdx.value >= 0) {
    onSelectMember(showMembers.value[activeIdx.value]);
  }
  close();
};
const scrollToActive = () => {
  if (
    activeIdx.value * 35 - proxy.$refs.scrollBox.wrap.clientHeight >
    proxy.$refs.scrollBox.wrap.scrollTop
  ) {
    proxy.$refs.scrollBox.wrap.scrollTop += 140;
    if (
      proxy.$refs.scrollBox.wrap.scrollTop >
      proxy.$refs.scrollBox.wrap.scrollHeight
    ) {
      proxy.$refs.scrollBox.wrap.scrollTop =
        proxy.$refs.scrollBox.wrap.scrollHeight;
    }
  }
  if (activeIdx.value * 35 < proxy.$refs.scrollBox.wrap.scrollTop) {
    proxy.$refs.scrollBox.wrap.scrollTop -= 140;
    if (proxy.$refs.scrollBox.wrap.scrollTop < 0) {
      proxy.$refs.scrollBox.wrap.scrollTop = 0;
    }
  }
};
const onSelectMember = member => {
  emit("select", member);
  show.value = false;
};
watch(
  () => props.searchText,
  () => {
    init();
  }
);
const isOwner = computed(() => {
  return userStore.userInfo.id == props.ownerId;
});
defineExpose({
  select,
  close,
  open,
  focus,
  moveUp,
  moveDown
});
</script>

<style scoped lang="scss">
.group-member-choose {
  position: fixed;
  width: 200px;
  height: 300px;
  border: 1px solid #53a0e79c;
  border-radius: 5px;
  background-color: #f5f5f5;
  box-shadow: 0px 0px 10px #ccc;
}
</style>
<template>
  <div class="chat-record">
    <div class="record-time">{{recording?parseInt(duration) +'s':''}}</div>
    <div class="voice-btn" :class="recording? 'recording':''">
      <span class="icon iconfont icon-voicelight"></span>
    </div>
    <div class="tip">
      {{stateTip}}
      <span class="quit-btn" @click="quitHandler">{{quitBtnText}}</span>
    </div>
    <el-row class="btn-group"></el-row>
  </div>
</template>
<script setup lang="ts" name="chatRecord">
import { ElMessage } from "element-plus";
import Recorder from "js-audio-recorder";
import { uploadFile } from "@api/message";
import {
  ref,
  toRefs,
  computed,
  watch,
  defineProps,
  defineEmits,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount,
  watchEffect
} from "vue";
const { proxy } = getCurrentInstance();

const props = defineProps<{
  visible?: boolean;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "send", data): void;
}>();
let rc = new Recorder();
let audio = new Audio();
const state = ref("STOP");
const recording = ref(false);
const stateTip = ref("按住空格开始说话，按ESC键或点击");
const mode = ref("RECORD");
const duration = ref(0);
const isQuit = ref(false);
const url = ref("");

const onClose = () => {
  // 关闭前清除数据
  rc.destroy();
  rc = new Recorder();
  audio.pause();
  mode.value = "RECORD";
  state.value = "STOP";
  emit("close");
};
onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  // window.addEventListener("keydup", handleKeyUp, true);
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeyDown);
  window.removeEventListener("keyup", handleKeyUp);
});
const handleKeyDown = e => {
  if (e.code === "Space") {
    // 在这里处理空格键触发的事件
    recording.value = true;
  } else if (e.code == "Ecs") {
    quitHandler();
  }
};
const handleKeyUp = e => {
  if (e.code === "Space") {
    // 在这里处理空格键触发的事件
    recording.value = false;
  }
};
let intervalId = null;
const onStartRecord = () => {
  if (intervalId) duration.value = 0;
  rc.start().then(steam => {
    intervalId = setInterval(() => {
      duration.value++;
    }, 1000);
  });
};
const onCompleteRecord = () => {
  if (rc) {
    rc.pause();
    rc = new Recorder();
    clearInterval(intervalId);
  }
};
const quitHandler = () => {
  if (recording.value) {
    isQuit.value = true;
    recording.value = false;
    cancelRecord();
  } else {
    emit("close");
  }
};
//取消录制
const cancelRecord = () => {
  if (rc) {
    rc.pause();
    rc = new Recorder();
  }
  if (intervalId) {
    clearInterval(intervalId);
  }
};
const onPlayAudio = () => {
  let wav = rc.getWAVBlob();
  let url = URL.createObjectURL(wav);
  proxy.$refs.audio.src = url;
  proxy.$refs.audio.play();
  mode.value = "PLAY";
};
const onStopAudio = () => {
  proxy.$refs.audio.pause();
  mode.value = "RECORD";
};
const onRestartRecord = () => {
  rc.destroy();
  rc = new Recorder();
  rc.start();
  state.value = "RUNNING";
  mode.value = "RECORD";
  stateTip.value = "正在录音...";
};
const onSendRecord = () => {
  let wav = rc.getWAVBlob();
  let name = new Date().getDate() + ".wav";
  var formData = new window.FormData();
  formData.append("file", wav, name);
  uploadFile(formData).then(url => {
    let data = {
      duration: parseInt(rc.duration),
      url: url
    };
    emit("send", data);
    onClose();
  });
};
watchEffect(() => {
  if (recording.value) {
    stateTip.value = "松手发送，按ESC键或点击";
    onStartRecord();
  } else {
    onCompleteRecord();
  }
});
const quitBtnText = computed(() => {
  if (recording.value) {
    return "取消发送";
  } else {
    return "退出";
  }
});
</script>


<style lang="scss">
.chat-record {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  background-color: #f2f2f2;
  .record-time {
    line-height: 10px;
    font-size: 12px;
    color: rgb(139, 139, 139);
  }
  .tip {
    font-size: 12px;
    color: rgb(139, 139, 139);
    .quit-btn {
      color: #0080ff;
      text-decoration: underline;
      cursor: pointer;
    }
  }
  .btn-group {
    margin-bottom: 20px;
  }
  .voice-btn {
    margin: 15px 0;
    box-sizing: content-box;
    background: radial-gradient(circle, #00c7ff, #009bff);
    height: 50px;
    border-radius: 50%;
    border: 2px solid #c1e0f4;
    color: white;
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    span {
      font-size: 20px;
    }
    &.recording {
      background: radial-gradient(circle, #00abff, #0080ff);
      border: 5px solid #c1e0f4;
    }
  }
}
</style>

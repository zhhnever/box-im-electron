<template>
  <div class="upload" @click="openFileDialog">
    <slot></slot>
  </div>
</template>
<script lang="ts" setup name="fileUpload">
import { ref, defineProps, defineEmits, defineExpose } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import request from "@renderer/utils/request";
const { ipcRendererChannel } = window;

const loading = ref(null);
let fileList = [];
const props = defineProps<{
  action?: string;
  fileTypes?: Array<string>;
  maxSize?: number;
  showLoading?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "success", data: any, file: any): void;
  (e: "fail", err: any, file: any): void;
  (e: "before", file: any): void;
  (e: "confirm", file: Array<any>): void;
}>();

const openFileDialog = async () => {
  fileList = [];
  //调用主线程的上传文件方法
  let files = await ipcRendererChannel.OpenFileDialog.invoke({
    fileTypes: props.fileTypes
  });
  if (files.length > 0) {
    fileList = files;
    emit("confirm", fileList);
  }
};

const uploadFile = files => {
  let accessToken = sessionStorage.getItem("accessToken");
  //调用主线程的上传文件方法
  let paths = files.map(v => v.path);
  let promise = ipcRendererChannel.uploadFile.invoke({
    files: paths,
    token: accessToken,
    url: __CONFIG__.BASE_API + props.action
  });
  if (promise) {
    promise
      .then(res => {
        //返回的是数组
        res.forEach((r, i) => {
          let data = JSON.parse(r.body);
          emit("success", data.data, files[i]);
        });
      })
      .catch(err => {
        emit("fail", err, files);
      })
      .finally(() => {
        loading.value?.close();
      });
  }
};

defineExpose({
  uploadFile
});
</script>

<style lang="scss" scoped>
.upload {
  i {
    font-size: 22px;
  }
}
</style>

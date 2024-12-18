<template>
  <div class="chat-input-area">
    <div
      :class="['edit-chat-container',isEmpty?'':'not-empty']"
      contenteditable="true"
      spellcheck="false"
      @paste.prevent="onPaste"
      @keydown="onKeydown"
      @compositionstart="compositionFlag=true"
      @compositionend="onCompositionEnd"
      @input="onEditorInput"
      @mousedown="onMousedown"
      ref="content"
      @blur="onBlur"
    ></div>
    <chat-at-box
      @select="onAtSelect"
      :search-text="atSearchText"
      ref="atBox"
      :ownerId="ownerId"
      :members="groupMembers"
    ></chat-at-box>
  </div>
</template>
<script setup lang="ts" name="ChatInput">
import {
  ref,
  watch,
  defineProps,
  nextTick,
  getCurrentInstance,
  defineExpose,
  defineEmits
} from "vue";
import ChatAtBox from "./ChatAtBox.vue";
import { textToUrl } from "@renderer/utils/emotion";
const props = defineProps<{
  ownerId?: number;
  groupMembers?: Array<any>;
}>();

const emit = defineEmits<{
  (e: "submit", data): void;
}>();
const { proxy } = getCurrentInstance();

const imageList = ref([]);
const fileList = ref([]);
const currentId = ref(0);
const atSearchText = ref(null);
const compositionFlag = ref(false);
const atIng = ref(false);
const isEmpty = ref(true);
const changeStored = ref(true);
const blurRange = ref(null);
const onPaste = e => {
  isEmpty.value = false;
  let txt = e.clipboardData.getData("Text");
  let range = window.getSelection().getRangeAt(0);
  if (
    range.startContainer !== range.endContainer ||
    range.startOffset !== range.endOffset
  ) {
    range.deleteContents();
  }
  // 粘贴图片和文件时，这里没有数据
  if (txt && typeof txt == "string") {
    let textNode = document.createTextNode(txt);
    range.insertNode(textNode);
    range.collapse();
    return;
  }
  let items = (e.clipboardData || window.clipboardData).items;
  if (items.length) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        let file = items[i].getAsFile();
        let imagePush = {
          fileId: generateId(),
          file: file,
          url: URL.createObjectURL(file)
        };
        imageList.value[imagePush.fileId] = imagePush;
        let line = newLine();
        let imageElement = document.createElement("img");
        imageElement.className = "chat-image no-text";
        imageElement.src = imagePush.url;
        imageElement.dataset.imgId = imagePush.fileId;
        line.appendChild(imageElement);
        let after = document.createTextNode("\u00A0");
        line.appendChild(after);
        selectElement(after, 1);
      } else {
        let asFile = items[i].getAsFile();
        if (!asFile) {
          continue;
        }
        let filePush = { fileId: generateId(), file: asFile };
        fileList.value[filePush.fileId] = filePush;
        let line = newLine();
        let fileElement = createFile(filePush);
        line.appendChild(fileElement);
        let after = document.createTextNode("\u00A0");
        line.appendChild(after);
        selectElement(after, 1);
      }
    }
  }
  range.collapse();
};
const selectElement = (element, endOffset) => {
  let selection = window.getSelection();
  // 插入元素可能不是立即执行的，vue可能会在插入元素后再更新dom
  nextTick(() => {
    let t1 = document.createRange();
    t1.setStart(element, 0);
    t1.setEnd(element, endOffset || 0);
    if (element.firstChild) {
      t1.selectNodeContents(element.firstChild);
    }
    t1.collapse();
    selection.removeAllRanges();
    selection.addRange(t1);
    // 需要时自动聚焦
    if (element.focus) {
      element.focus();
    }
  });
};
const onCompositionEnd = e => {
  compositionFlag.value = false;
  onEditorInput(e);
};
const onKeydown = e => {
  if (e.keyCode === 13) {
    e.preventDefault();
    e.stopPropagation();
    if (atIng.value) {
      console.log("选中at的人");
      proxy.$refs.atBox.select();
      return;
    }
    if (e.ctrlKey) {
      let line = newLine();
      let after = document.createTextNode("\u00A0");
      line.appendChild(after);
      selectElement(line.childNodes[0], 0);
    } else {
      // 中文输入标记
      if (compositionFlag.value) {
        return;
      }
      submit();
    }
    return;
  }
  // 删除键
  if (e.keyCode === 8) {
    console.log("delete");
    // 等待dom更新
    setTimeout(() => {
      let s = proxy.$refs.content.innerHTML.trim();
      // 空dom时，需要刷新dom
      console.log(s);
      if (s === "" || s === "<br>" || s === "<div>&nbsp;</div>") {
        // 拼接随机长度的空格，以刷新dom
        empty();
        isEmpty.value = true;
        selectElement(proxy.$refs.content, null);
      } else {
        isEmpty.value = false;
      }
    });
  }
  // at框打开时，上下键移动特殊处理
  if (atIng.value) {
    if (e.keyCode === 38) {
      e.preventDefault();
      e.stopPropagation();
      proxy.$refs.atBox.moveUp();
    }
    if (e.keyCode === 40) {
      e.preventDefault();
      e.stopPropagation();
      proxy.$refs.atBox.moveDown();
    }
  }
};
const onAtSelect = member => {
  atIng.value = false;
  // 选中输入的 @xx 符
  let blurRan = blurRange.value;
  let endContainer = blurRange.endContainer;
  let startOffset = endContainer.data.indexOf("@" + atSearchText.value);
  let endOffset = startOffset + atSearchText.value.length + 1;
  blurRan.setStart(blurRan.endContainer, startOffset);
  blurRan.setEnd(blurRan.endContainer, endOffset);
  blurRan.deleteContents();
  blurRan.collapse();
  console.log("onAtSelect");
  focus();
  // 创建元素节点
  let element = document.createElement("SPAN");
  element.className = "chat-at-user";
  element.dataset.id = member.userId;
  element.contentEditable = "false";
  element.innerText = `@${member.showNickName}`;
  blurRan.insertNode(element);
  // 光标移动到末尾
  blurRan.collapse();

  // 插入空格
  let textNode = document.createTextNode("\u00A0");
  blurRan.insertNode(textNode);

  blurRan.collapse();
  atSearchText.value = "";
  selectElement(textNode, 1);
};
const onEditorInput = e => {
  isEmpty.value = false;
  changeStored.value = false;
  if (props.groupMembers && !compositionFlag.value) {
    let selection = window.getSelection();
    let range = selection.getRangeAt(0);
    // 截取@后面的名称作为过滤条件，并以空格结束
    let endContainer = range.endContainer;
    let endOffset = range.endOffset;
    let textContent = endContainer.textContent;
    let startIndex = -1;
    for (let i = endOffset; i >= 0; i--) {
      if (textContent[i] === "@") {
        startIndex = i;
        break;
      }
    }
    // 没有at符号，则关闭弹窗
    if (startIndex === -1) {
      proxy.$refs.atBox.close();
      return;
    }

    let endIndex = endOffset;
    for (let i = endOffset; i < textContent.length; i++) {
      if (textContent[i] === " ") {
        endIndex = i;
        break;
      }
    }
    atSearchText.value = textContent.substring(startIndex + 1, endIndex).trim();
    // 打开选择弹窗
    if (atSearchText.value == "") {
      showAtBox(e);
    }
  }
};
const onBlur = e => {
  updateRange();
};
const onMousedown = () => {
  if (atIng.value) {
    proxy.$refs.atBox.close();
    atIng.value = false;
  }
};
const insertEmoji = emojiText => {
  let emojiElement = document.createElement("img");
  emojiElement.className = "chat-emoji no-text";
  emojiElement.dataset.emojiCode = emojiText;
  emojiElement.src = textToUrl(emojiText);

  let blurRan = blurRange.value;
  if (!blurRan) {
    focus();
    updateRange();
    blurRan = blurRange.value;
  }
  if (
    blurRan.startContainer !== blurRan.endContainer ||
    blurRan.startOffset !== blurRan.endOffset
  ) {
    blurRan.deleteContents();
  }
  blurRan.insertNode(emojiElement);
  blurRan.collapse();

  let textNode = document.createTextNode("\u00A0");
  blurRan.insertNode(textNode);
  blurRan.collapse();

  selectElement(textNode, null);
  updateRange();
  isEmpty.value = false;
};
const generateId = () => {
  return currentId.value++;
};
const createFile = filePush => {
  let file = filePush.file;
  let fileId = filePush.fileId;
  let container = document.createElement("div");
  container.className = "chat-file-container no-text";
  container.contentEditable = "false";
  container.dataset.fileId = fileId;

  let left = document.createElement("div");
  left.className = "file-position-left";
  container.appendChild(left);

  let icon = document.createElement("div");
  icon.className = "el-icon-document";
  left.appendChild(icon);

  let right = document.createElement("div");
  right.className = "file-position-right";
  container.appendChild(right);

  let fileName = document.createElement("div");
  fileName.className = "file-name";
  fileName.innerText = file.name;

  let fileSize = document.createElement("div");
  fileSize.className = "file-size";
  fileSize.innerText = sizeConvert(file.size);

  right.appendChild(fileName);
  right.appendChild(fileSize);

  return container;
};
const sizeConvert = len => {
  if (len < 1024) {
    return len + "B";
  } else if (len < 1024 * 1024) {
    return (len / 1024).toFixed(2) + "KB";
  } else if (len < 1024 * 1024 * 1024) {
    return (len / 1024 / 1024).toFixed(2) + "MB";
  } else {
    return (len / 1024 / 1024 / 1024).toFixed(2) + "GB";
  }
};
const updateRange = () => {
  let selection = window.getSelection();
  blurRange.value = selection.getRangeAt(0);
};
const newLine = () => {
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  let divElement = document.createElement("div");
  let endContainer = range.endContainer;
  let parentElement = endContainer.parentElement;
  if (parentElement.parentElement === proxy.$refs.content) {
    divElement.innerHTML = endContainer.textContent
      .substring(range.endOffset)
      .trim();
    endContainer.textContent = endContainer.textContent.substring(
      0,
      range.endOffset
    );
    // 插入到当前div（当前行）后面
    parentElement.insertAdjacentElement("afterend", divElement);
  } else {
    divElement.innerHTML = "";
    proxy.$refs.content.append(divElement);
  }
  return divElement;
};
const clear = () => {
  empty();
  imageList.value = [];
  fileList.value = [];
};
const empty = () => {
  proxy.$refs.content.innerHTML = "";
  let line = newLine();
  let after = document.createTextNode("\u00A0");
  line.appendChild(after);
  nextTick(() => selectElement(after));
};
const showAtBox = e => {
  atIng.value = true;
  // show之后会自动更新当前搜索的text
  // atSearchText.value = "";
  let selection = window.getSelection();
  let range = selection.getRangeAt(0);
  // 光标所在坐标
  let pos = range.getBoundingClientRect();
  proxy.$refs.atBox.open({
    x: pos.x,
    y: pos.y
  });
  // 记录光标所在位置
  updateRange();
};
const html2Escape = strHtml => {
  return strHtml.replace(/[<>&"]/g, function(c) {
    return {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;"
    }[c];
  });
};
const submit = () => {
  let nodes = proxy.$refs.content.childNodes;
  let fullList = [];
  let tempText = "";
  let atUserIds = [];
  let each = nodes => {
    for (let i = 0; i < nodes.length; i++) {
      let node = nodes[i];
      if (!node) {
        continue;
      }
      if (node.nodeType === 3) {
        tempText += html2Escape(node.textContent);
        continue;
      }
      let nodeName = node.nodeName.toLowerCase();
      if (nodeName === "script") {
        continue;
      }
      let text = tempText.trim();
      if (nodeName === "img") {
        let imgId = node.dataset.imgId;
        if (imgId) {
          if (text) {
            fullList.push({
              type: "text",
              content: text,
              atUserIds: atUserIds
            });
            tempText = "";
            atUserIds = [];
          }
          fullList.push({
            type: "image",
            content: imageList.value[imgId]
          });
        } else {
          let emojiCode = node.dataset.emojiCode;
          tempText += emojiCode;
        }
      } else if (nodeName === "div") {
        let fileId = node.dataset.fileId;
        // 文件
        if (fileId) {
          if (text) {
            fullList.push({
              type: "text",
              content: text,
              atUserIds: atUserIds
            });
            tempText = "";
            atUserIds = [];
          }
          fullList.push({
            type: "file",
            content: fileList.value[fileId]
          });
        } else {
          tempText += "\n";
          each(node.childNodes);
        }
      } else if (nodeName === "span") {
        if (node.dataset.id) {
          tempText += node.innerHTML;
          atUserIds.push(node.dataset.id);
        } else {
          tempText += node.outerHtml;
        }
      }
    }
  };
  each(nodes);
  let text = tempText.trim();
  if (text !== "") {
    fullList.push({
      type: "text",
      content: text,
      atUserIds: atUserIds
    });
  }
  emit("submit", fullList);
};
const focus = () => {
  proxy.$refs.content.focus();
};

defineExpose({
  insertEmoji,
  focus,
  submit,
  clear
});
</script>

<style lang="scss">
.chat-input-area {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f2f2f2;
  .edit-chat-container {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    outline: none;
    padding-left: 10px;
    line-height: 30px;
    font-size: 16px;
    text-align: left;
    overflow-y: scroll;

    // 单独一行时，无法在前面输入的bug
    > div:before {
      content: "\00a0";
      font-size: 14px;
      position: absolute;
      top: 0;
      left: 0;
    }

    .chat-image {
      display: block;
      max-width: 200px;
      max-height: 100px;
      border: 1px solid #e6e6e6;
      cursor: pointer;
    }

    .chat-emoji {
      width: 30px;
      height: 30px;
      vertical-align: top;
      cursor: pointer;
    }

    .chat-file-container {
      max-width: 65%;
      padding: 10px;
      border: 2px solid #587ff0;
      display: flex;
      background: #eeec;
      border-radius: 10px;

      .file-position-left {
        display: flex;
        width: 80px;
        justify-content: center;
        align-items: center;

        .el-icon-document {
          font-size: 40px;
          text-align: center;
          color: #d42e07;
        }
      }

      .file-position-right {
        flex: 1;

        .file-name {
          font-size: 16px;
          font-weight: 600;
          color: #66b1ff;
        }

        .file-size {
          font-size: 14px;
          font-weight: 600;
          color: black;
        }
      }
    }

    .chat-at-user {
      color: #00f;
      font-weight: 600;

      border-radius: 3px;
    }
  }

  .edit-chat-container > div:nth-of-type(1):after {
    content: "请输入消息（按Ctrl+Enter键换行）";
    color: gray;
  }

  .edit-chat-container.not-empty > div:nth-of-type(1):after {
    content: none;
  }
}
</style>
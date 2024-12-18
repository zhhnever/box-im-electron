<template>
  <div class="login-view">
    <div class="login-content">
      <el-form
        class="login-form"
        :model="loginForm"
        ref="loginFormRef"
        :rules="rules"
        label-width="80px"
        @keyup.enter.native="submitForm('loginForm')"
      >
        <div class="login-brand">登陆</div>

        <el-form-item label="用户名" prop="userName">
          <el-input v-model="loginForm.userName" placeholder="用户名"></el-input>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            type="password"
            v-model="loginForm.password"
            autocomplete="off"
            placeholder="密码"
          ></el-input>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitForm('loginForm')">登陆</el-button>
          <el-button @click="resetForm('loginForm')">清空</el-button>
        </el-form-item>
        <!-- <div class="register">
					<router-link to="/register">没有账号,前往注册</router-link>
        </div>-->
      </el-form>
    </div>
  </div>
</template>
<script setup lang="ts" name="login">
import { TERMINAL_TYPE } from "@renderer/utils/enum";
import {
  setToken,
  getToken,
  setRefreshToken,
  setCookies,
  getCookies
} from "@renderer/utils/auth";
import { login } from "@api/login";
import { ElMessage } from "element-plus";
import router from "@renderer/router";
import { getCurrentInstance, onMounted, ref, reactive } from "vue";

const { ipcRendererChannel } = window;

const { proxy } = getCurrentInstance();

const loginForm = ref<{
  terminal: number;
  userName: string;
  password: string;
}>({
  terminal: TERMINAL_TYPE.WEB,
  userName: "",
  password: ""
});

let rules = {
  userName: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur"
    }
  ],
  password: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur"
    }
  ]
};
const submitForm = formName => {
  proxy.$refs.loginFormRef.validate(valid => {
    if (valid) {
      login(loginForm.value).then(data => {
        // 保存密码到cookie(不安全)
        setCookies("username", loginForm.value.userName);
        setCookies("password", loginForm.value.password);
        // 保存token
        sessionStorage.setItem("accessToken", data.accessToken);
        sessionStorage.setItem("refreshToken", data.refreshToken);
        setToken(data.accessToken);
        setRefreshToken(data.refreshToken);
        ElMessage.success("登陆成功");
        ipcRendererChannel.ResizeMainWindow.invoke({ w: 1030, h: 710 });

        router.push("/");
      });
    }
    console.log(valid);
  });
};
const resetForm = formName => {
  proxy.$refs.formName.resetFields();
};
onMounted(() => {
  //   loginForm.value.userName = getCookies("username");
  //   // cookie存密码并不安全，暂时是为了方便
  //   loginForm.value.password = getCookies("password");
});
</script>


<style scoped lang="scss">
.login-view {
  width: 100%;
  height: 100%;
  background: #e8f2ff;
  background-size: cover;
  box-sizing: border-box;

  .login-content {
    position: relative;
    display: flex;
    justify-content: space-around;
    align-items: center;

    .login-form {
      height: 340px;
      width: 400px;
      padding: 30px;
      background: white;
      opacity: 0.9;
      box-shadow: 0px 0px 1px #ccc;
      border-radius: 3%;
      overflow: hidden;
      border: 1px solid #ccc;

      .login-brand {
        line-height: 50px;
        margin: 30px 0 40px 0;
        font-size: 22px;
        font-weight: 600;
        letter-spacing: 2px;
        text-transform: uppercase;
        text-align: center;
      }

      .register {
        display: flex;
        flex-direction: row-reverse;
        line-height: 40px;
        text-align: left;
        padding-left: 20px;
      }
    }
  }
}
</style>
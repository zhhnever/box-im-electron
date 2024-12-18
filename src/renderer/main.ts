import { createApp } from "vue";
import { createPinia } from "pinia";
import ElementPlus from 'element-plus'

import 'element-plus/dist/index.css'
import "./assets/iconfont/iconfont.css"
import "./styles/index.scss";
import "./permission";
import App from "./App.vue";
import router from "./router";
import { errorHandler } from "./error";
import "./utils/hackIpcRenderer";
import eventBus from 'vue3-eventbus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'


const app = createApp(App);
const store = createPinia();
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
}
app.use(eventBus)
app.use(ElementPlus)
app.use(router);
app.use(store);
errorHandler(app);

app.mount("#app");

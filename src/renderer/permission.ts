import router from './router'
import Performance from '@renderer/utils/performance'
import {
  getToken,
} from "@renderer/utils/auth";

const whiteList = ['/login'];

var end = null
router.beforeEach((to, from, next) => {
  end = Performance.startExecute(`${from.path} => ${to.path} 路由耗时`) /// 路由性能监控
  let token = getToken()
  if (token) {
    if (to.path === '/login') {
      next({ path: '/' })
    } else {
      next()
    }
    end()
  } else {
    // 没有token
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next()
    } else {
      next({ path: '/login' })
    }
  }
})

router.afterEach(() => { })

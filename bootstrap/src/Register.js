import * as singleSpa from 'single-spa';
import { GlobalEventDistributor } from './GlobalEventDistributor';
const globalEventDistributor = new GlobalEventDistributor();
const SystemJS = window.System;

// hash 模式
export function hashPrefix(app) {
  return function(location) {
   
    let isShow = false;
    //如果该应用 有多个需要匹配的路劲
    if (isArray(app.path)) {
      app.path.forEach(path => {
        if (location.hash.startsWith(`#${path}`)) {
          isShow = true;
        }
      });
    }
    // 普通情况
    else if (location.hash.startsWith(`#${app.url || app.path}`)) {
      isShow = true;
    }
    // console.log('hashPrefix', isShow);
    return isShow;
  };
}

// 普通路径模式
export function pathPrefix(app) {
  return function(location) {
    let isShow = false;
    //如果该应用 有多个需要匹配的路劲
    if (isArray(app.path)) {
      app.path.forEach(path => {
        if (location.pathname.indexOf(`${path}`) === 0) {
          isShow = true;
        }
      });
    }
    // 普通情况
    else if (location.pathname.indexOf(`${app.url || app.path}`) === 0) {
      isShow = true;
    }
    return isShow;
  };
}
export async function registerApp(params) {
  // 导入store模块
  let storeModule = {},
    customProps = { globalEventDistributor: globalEventDistributor };

  // 尝试导入store
  try {
    storeModule = params.store ? await SystemJS.import(params.store) : { storeInstance: null };
  } catch (e) {
    console.log(`Could not load store of app ${params.name}.`, e);
    //如果失败则不注册该模块
    return;
  }
  // 注册应用于事件派发器
  if (storeModule.storeInstance && globalEventDistributor) {
    //取出 redux storeInstance
    customProps.store = storeModule.storeInstance;

    // 注册到全局
    globalEventDistributor.registerStore(storeModule.storeInstance);
  }

  //准备自定义的props,传入每一个单独工程项目
  customProps = {
    store: storeModule,
    globalEventDistributor: globalEventDistributor,
  };
  // console.log('register', customProps);
  singleSpa.registerApplication(
    params.name,
    async () => {
      let component;

      for (let i = 0; i < params.main.css.length; i++) {
        await SystemJS.import(params.main.css[i]);
      }

      // 依次加载入口文件（runtime，main），返回最后一个
      for (let i = 0; i < params.main.js.length; i++) {
        component = await SystemJS.import(params.main.js[i])
          .then(m => {
            // console.log('element.main.js', i, m);
            return m;
          })
          .catch(ex => console.error(ex));
      }
      // console.log(component, 'component');
      return component;
    },
    params.base || params.name === 'base' ? () => true : hashPrefix(params),
    customProps
  );
}

function isArray(o) {
  return Object.prototype.toString.call(o) == '[object Array]';
}

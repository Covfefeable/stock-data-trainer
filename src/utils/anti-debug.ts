import type { App } from "vue";

const isDevToolsOpenByWindowSize = () => {
  const threshold = 160;
  const devtoolsOpen =
    window.outerWidth - window.innerWidth > threshold ||
    window.outerHeight - window.innerHeight > threshold;
  return devtoolsOpen;
};

const isDevToolsOpenBySourceMap = () => {
  function getCookie(name: string) {
    const cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].split("=");
      if (cookie[0] === name) {
        return cookie[1];
      }
    }
    return null;
  }

  return getCookie("cookie") === "1";
};

const createAntiDebug = {
  install: (app: App<Element>) => {
    // 通过窗口大小是否发生改变来判断 devtools 是否打开
    const isDevToolsOpen = () => {
      const pinia = app.config.globalProperties.$pinia;
      const isAdmin = pinia.state.value?.user?.userInfo?.userRole === "admin";

      const isOpenByWindowSize = isDevToolsOpenByWindowSize();
      const isOpenBySourceMap = isDevToolsOpenBySourceMap();
      return (
        [isOpenByWindowSize, isOpenBySourceMap].some(Boolean) &&
        !import.meta.env.DEV &&
        !isAdmin
      );
    };

    const observer = new MutationObserver((_list, observer) => {
      if (isDevToolsOpen()) {
        // 当开发者工具打开时，执行反调试操作，这里是刷新页面
        observer.disconnect();
        app.unmount();
      }
    });

    // 配置 MutationObserver 监听的目标节点和选项
    observer.observe(document, {
      attributes: false,
      childList: true,
      subtree: true,
    });
  },
};

export default createAntiDebug;

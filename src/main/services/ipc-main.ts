// todo 是否将ipc-main.ts文件中的代码拆分到多个文件中？通过abstract继承？或者注册回调函数？
import { ipcMain } from "electron";
import { IpcMainHandleClass } from "./ipc-main-handle";
import { BrowserWindow } from "electron";

export const useMainDefaultIpc = () => {
  return {
    defaultIpc: (mainWindow: BrowserWindow) => {
      const ipcMainHandle = new IpcMainHandleClass(mainWindow);
      Object.entries(ipcMainHandle).forEach(
        ([ipcChannelName, ipcListener]: [string, () => void]) => {
          console.log("ipcChannelName:", ipcChannelName);
          if (typeof ipcListener === "function") {
            ipcMain.handle(ipcChannelName, ipcListener);
          }
        }
      );
    },
  };
};

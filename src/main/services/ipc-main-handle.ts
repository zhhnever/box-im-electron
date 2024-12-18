import { dialog, BrowserWindow, app } from "electron";
import { getPreloadFile, winURL } from "../config/static-path";
import { updater } from "../services/hot-updater";
import DownloadFile from "../services/download-file";
import Update from "../services/check-update";
import config from "@config/index";
import { IIpcMainHandle } from "../../ipc/index";
import { webContentSend } from "./web-content-send";
import fs from "fs";
import path from "path";
const request = require('request')


export class IpcMainHandleClass implements IIpcMainHandle {
  private allUpdater: Update;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.allUpdater = new Update();
    this.mainWindow = mainWindow;
  }
  StartDownload: (
    event: Electron.IpcMainInvokeEvent,
    args: string
  ) => void | Promise<void> = (event, downloadUrl) => {
    new DownloadFile(
      BrowserWindow.fromWebContents(event.sender),
      downloadUrl
    ).start();
  };
  StartServer: (
    event: Electron.IpcMainInvokeEvent
  ) => string | Promise<string> = async () => {
    dialog.showErrorBox("error", "API is obsolete");
    return "API is obsolete";
  };
  StopServer: (event: Electron.IpcMainInvokeEvent) => string | Promise<string> =
    async () => {
      dialog.showErrorBox("error", "API is obsolete");
      return "API is obsolete";
    };
  HotUpdate: (event: Electron.IpcMainInvokeEvent) => void | Promise<void> = (
    event
  ) => {
    updater(BrowserWindow.fromWebContents(event.sender));
  };
  OpenWin: (
    event: Electron.IpcMainInvokeEvent,
    args: { url: string; IsPay?: boolean; PayUrl?: string; sendData?: unknown }
  ) => void | Promise<void> = (event, arg) => {
    const childWin = new BrowserWindow({
      titleBarStyle: config.IsUseSysTitle ? "default" : "hidden",
      height: 595,
      useContentSize: true,
      width: 1140,
      autoHideMenuBar: true,
      minWidth: 842,
      frame: config.IsUseSysTitle,
      show: false,
      webPreferences: {
        sandbox: false,
        webSecurity: false,
        // 如果是开发模式可以使用devTools
        devTools: process.env.NODE_ENV === "development",
        // 在macos中启用橡皮动画
        scrollBounce: process.platform === "darwin",
        preload: getPreloadFile("preload"),
      },
    });
    // 开发模式下自动开启devtools
    if (process.env.NODE_ENV === "development") {
      childWin.webContents.openDevTools();
    }
    childWin.loadURL(winURL + `#${arg.url}`);
    childWin.once("ready-to-show", () => {
      childWin.show();
      if (arg.IsPay) {
        // 检查支付时候自动关闭小窗口
        const testUrl = setInterval(() => {
          const Url = childWin.webContents.getURL();
          if (Url.includes(arg.PayUrl)) {
            childWin.close();
          }
        }, 1200);
        childWin.on("close", () => {
          clearInterval(testUrl);
        });
      }
    });
    // 渲染进程显示时触发
    childWin.once("show", () => {
      webContentSend.SendDataTest(childWin.webContents, arg.sendData);
    });
  };

  IsUseSysTitle: (
    event: Electron.IpcMainInvokeEvent
  ) => boolean | Promise<boolean> = async () => {
    return config.IsUseSysTitle;
  };
  AppClose: (event: Electron.IpcMainInvokeEvent) => void | Promise<void> = (
    event
  ) => {
    app.quit();
  };
  CheckUpdate: (event: Electron.IpcMainInvokeEvent) => void | Promise<void> = (
    event
  ) => {
    this.allUpdater.checkUpdate(BrowserWindow.fromWebContents(event.sender));
  };
  ConfirmUpdate: (event: Electron.IpcMainInvokeEvent) => void | Promise<void> =
    () => {
      this.allUpdater.quitAndInstall();
    };
  OpenMessagebox: (
    event: Electron.IpcMainInvokeEvent,
    args: Electron.MessageBoxOptions
  ) =>
    | Electron.MessageBoxReturnValue
    | Promise<Electron.MessageBoxReturnValue> = async (event, arg) => {
      const res = await dialog.showMessageBox(
        BrowserWindow.fromWebContents(event.sender),
        {
          type: arg.type || "info",
          title: arg.title || "",
          buttons: arg.buttons || [],
          message: arg.message || "",
          noLink: arg.noLink || true,
        }
      );
      return res;
    };
  OpenErrorbox: (
    event: Electron.IpcMainInvokeEvent,
    arg: { title: string; message: string }
  ) => void | Promise<void> = (event, arg) => {
    dialog.showErrorBox(arg.title, arg.message);
  };
  //更改窗口大小
  ResizeMainWindow: (event: Electron.IpcMainInvokeEvent, arg: { w: number; h: number }) => void = (event, arg) => {
    this.mainWindow.setSize(arg.w, arg.h)
  };
  //文件选择器
  OpenFileDialog: (event: Electron.IpcMainInvokeEvent, arg: { fileTypes: Array<string> }) => Array<any> = (event, arg) => {
    let filePaths = dialog.showOpenDialogSync({
      title: "选择文件",
      filters: [{ name: "file", extensions: arg.fileTypes }],
      properties: ["openFile", "multiSelections"]
    })
    if (!filePaths) {
      return []
    }
    return filePaths.map(v => {
      let fileStat = fs.lstatSync(v)
      let fileName = path.basename(v)
      return {
        name: fileName,
        size: fileStat.size,
        path: v
      }
    })

  };
  //上传文件
  uploadFile: (event: Electron.IpcMainInvokeEvent, arg: { files: Array<any>, token: string, url: string }) => void | Promise<Array<any>> = async (event, arg) => {
    console.log(arg.url);

    if (arg.files) {
      let promiseArr = arg.files.map(file => {
        console.log(file);

        //获取文件的基本信息
        let fileStat = fs.lstatSync(file)
        let fileName = path.basename(file)
        let formData = {
          'file': fs.createReadStream(file)
        }
        return new Promise((resolve, reject) => {
          request({
            url: arg.url,
            method: 'POST',
            formData: formData,
            headers: {
              'accessToken': arg.token,
              "Content-Type": "multipart/form-data"
            }
          }, (err, httpResponse, body) => {
            if (err) {
              reject({
                file: {
                  name: fileName,
                  path: file,
                  size: fileStat.size
                }, err
              })
            } else {
              resolve({
                file: {
                  path: file,
                  name: fileName,
                  size: fileStat.size
                }, body
              })
            }
          })
        })
      })
      return await Promise.all(promiseArr)
    }
  };
}

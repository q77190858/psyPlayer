const { app, BrowserWindow, protocol, ipcMain, dialog } = require('electron/main')
const path = require('node:path')
const fs = require("node:fs")
const fsp = require("node:fs").promises

async function handleDirOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  if (!canceled) {
    rawData = fs.readFileSync(path.join(filePaths[0], 'commandsV3.json'))
    commandsV3 = JSON.parse(rawData)
    rawData = fs.readFileSync(path.join(filePaths[0], 'playback.json'))
    playback = JSON.parse(rawData)
    var msgList = []
    for (let i = 0; i < commandsV3['msg'].length; i++) {
      msgFileName = commandsV3['msg'][i]['loc'].split("/").pop()
      rawData = fs.readFileSync(path.join(filePaths[0], msgFileName))
      msg = JSON.parse(rawData)["list"]
      msgList = msgList.concat(msg)
    }
    var pageList = []
    for (let i = 0; i < commandsV3['pages'].length; i++) {
      p = commandsV3['pages'][i]
      if ("drawfile" in p) {
        rawData = fs.readFileSync(path.join(filePaths[0], p["drawfile"]))
        draw = JSON.parse(rawData)
        p["draw"]=draw
      }
      pageList.push(p)
    }
    return { 'dirPath': filePaths[0], 'commandsV3': commandsV3, 'playback': playback, 'msgList':msgList, 'pageList':pageList }
  }
}

// 我们需要注册一个特别的名称（比如"local-resource"）作为我们的“通行证”。
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-resource",
    privileges: {
      secure: true, // 让 Electron 信任这个方式就像信任网站的 HTTPS 一样
      supportFetchAPI: true, // 允许我们像在网页上那样请求资源
      standard: true, // 让这种方式的网址看起来像普通的网址
      bypassCSP: true, // 允许我们绕过一些安全限制
      stream: true, // 允许我们以流的形式读取文件，这对于大文件很有用
    },
  },
]);

function createWindow() {
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    icon: "icon.png",
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })
  mainWindow.loadFile('index.html')
}

app.whenReady().then(() => {
  // 一个辅助函数，用于处理不同操作系统的文件路径问题
  function convertPath(originalPath) {
    const match = originalPath.match(/^\/([a-zA-Z])\/(.*)$/);
    if (match) {
      // 为 Windows 系统转换路径格式
      return `${match[1]}:/${match[2]}`;
    } else {
      return originalPath; // 其他系统直接使用原始路径
    }
  }
  // 使用自定义的"local-resource"协议处理请求。
  protocol.handle("local-resource", async (request) => {
    // 解码请求URL，去掉协议部分，以获得原始路径。
    // 这里使用正则表达式将"local-resource:/"替换为空字符串，并解码URL编码。
    const decodedUrl = decodeURIComponent(
      request.url.replace(new RegExp(`^local-resource:/`, "i"), "")
    );

    // 打印解码后的URL，以便调试。
    console.log("decodedUrl", decodedUrl);

    // 根据操作系统平台，可能需要转换路径格式。
    // 如果是Windows平台，调用convertPath方法转换路径；否则，直接使用解码后的URL。
    const fullPath =
      process.platform === "win32" ? convertPath(decodedUrl) : decodedUrl;

    // 打印最终的文件路径，以便调试。
    console.log("fullPath", fullPath);

    // 异步读取文件内容。
    const data = await fsp.readFile(fullPath);

    // 将读取的文件内容封装在Response对象中返回。
    // 这允许Electron应用加载和显示来自自定义协议URL的内容。
    return new Response(data);
  });

  ipcMain.handle('dialog:openDir', handleDirOpen)
  createWindow()
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})
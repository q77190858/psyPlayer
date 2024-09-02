const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('electronAPI', {
  openDir: () => ipcRenderer.invoke('dialog:openDir')
})
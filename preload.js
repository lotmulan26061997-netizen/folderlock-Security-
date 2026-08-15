const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('vault', {
  list: () => ipcRenderer.invoke('vault:list'),
  lock: (payload) => ipcRenderer.invoke('vault:lock', payload),
  unlock: (payload) => ipcRenderer.invoke('vault:unlock', payload),
  chooseFolder: () => ipcRenderer.invoke('vault:choose-folder'),
  // Resolve a real filesystem path from a File dropped onto the window.
  pathForFile: (file) => webUtils.getPathForFile(file),
});

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    onActiveApp: (callback) => ipcRenderer.on('active-app', callback)
});

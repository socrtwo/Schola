'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// Expose a minimal, safe API to the renderer
contextBridge.exposeInMainWorld('scholaElectron', {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    electron: process.versions.electron,
    chrome: process.versions.chrome,
  },
  // Example IPC bridge (extend as needed)
  send: (channel, data) => {
    const allowedChannels = ['export-data', 'print-roster'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  receive: (channel, func) => {
    const allowedChannels = ['export-done', 'print-done'];
    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  },
});

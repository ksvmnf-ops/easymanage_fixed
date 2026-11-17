const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('easyManageDesktop', {
  platform: process.platform,
  version: process.versions.electron
});

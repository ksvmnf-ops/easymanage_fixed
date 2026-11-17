const { app, BrowserWindow, dialog, shell, session } = require('electron');
const fs = require('fs');
const path = require('path');

const DEFAULT_URL = 'https://script.google.com/macros/s/REPLACE_WITH_DEPLOYMENT_ID/exec';

function configCandidates() {
  return [
    process.env.EASYMANAGE_GAS_URL ? null : null,
    path.join(process.resourcesPath || '', 'config.json'),
    path.join(__dirname, 'config.json'),
    path.join(process.cwd(), 'config.json')
  ].filter(Boolean);
}

function getAppUrl() {
  if (process.env.EASYMANAGE_GAS_URL) return process.env.EASYMANAGE_GAS_URL;
  for (const file of configCandidates()) {
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8')).gasWebAppUrl;
      if (typeof value === 'string' && value.startsWith('https://')) return value;
    } catch (_) {}
  }
  return DEFAULT_URL;
}

function isConfigured(url) {
  return url && !url.includes('REPLACE_WITH_DEPLOYMENT_ID') && /^https:\/\//i.test(url);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: !app.isPackaged
    }
  });

  const gasUrl = getAppUrl();
  if (!isConfigured(gasUrl)) {
    win.loadFile(path.join(__dirname, 'loading.html'));
    return;
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://script.google.com/') && !url.startsWith('https://googleusercontent.com/')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.loadURL(gasUrl);
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === 'clipboard-read' || permission === 'clipboard-sanitized-write');
  });
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

import { join } from 'node:path';
import { app, BrowserWindow, shell } from './electron';
import { getIconPath } from './paths';

export type MainWindow = BrowserWindow | null;

export interface WindowState {
  mainWindow: MainWindow;
  isQuitting: boolean;
  minimizeToTrayEnabled: boolean;
  onWindowClosed?: () => void;
}

export const windowState: WindowState = {
  mainWindow: null,
  isQuitting: false,
  minimizeToTrayEnabled: false
};

export function showMainWindow(): void {
  if (!windowState.mainWindow || windowState.mainWindow.isDestroyed()) {
    return;
  }

  windowState.mainWindow.show();
  if (windowState.mainWindow.isMinimized()) {
    windowState.mainWindow.restore();
  }
  windowState.mainWindow.focus();
}

export function hideMainWindow(): void {
  if (!windowState.mainWindow || windowState.mainWindow.isDestroyed()) {
    return;
  }

  windowState.mainWindow.hide();
}

export async function createMainWindow(): Promise<BrowserWindow> {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'radioss',
    autoHideMenuBar: true,
    icon: getIconPath(process.platform === 'win32' ? 'radioss.ico' : 'radioss.png'),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  windowState.mainWindow = mainWindow;

  mainWindow.on('close', (event) => {
    if (windowState.minimizeToTrayEnabled && !windowState.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return;
    }

    if (!windowState.isQuitting) {
      event.preventDefault();
      app.quit();
    }
  });

  mainWindow.on('closed', () => {
    windowState.mainWindow = null;
    windowState.onWindowClosed?.();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL();
    if (currentUrl && url !== currentUrl) {
      event.preventDefault();
      void shell.openExternal(url);
    }
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    await mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    await mainWindow.loadFile(join(__dirname, '../../dist/index.html'));
  }

  return mainWindow;
}

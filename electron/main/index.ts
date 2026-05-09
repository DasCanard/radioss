import { app, BrowserWindow } from './electron';
import { setDockIcon } from './app-icon';
import { registerIpcHandlers } from './ipc';
import { destroyTray } from './tray';
import { createMainWindow, showMainWindow, windowState } from './window';

app.setName('radioss');
app.setAppUserModelId('com.dascanard.radioss');

app.on('before-quit', () => {
  windowState.isQuitting = true;
});

windowState.onWindowClosed = () => {
  if (!windowState.minimizeToTrayEnabled) {
    destroyTray();
  }
};

app.whenReady().then(async () => {
  setDockIcon();
  registerIpcHandlers();
  await createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createMainWindow();
    } else {
      showMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

import { app, BrowserWindow } from './electron';
import { setDockIcon } from './app-icon';
import { registerIpcHandlers, shutdownDiscordRPC } from './ipc';
import { destroyTray } from './tray';
import { createMainWindow, showMainWindow, windowState } from './window';

app.setName('radioss');
app.setAppUserModelId('com.dascanard.radioss');

let discordShutdownComplete = false;

app.on('before-quit', (event) => {
  windowState.isQuitting = true;

  if (discordShutdownComplete) {
    return;
  }

  event.preventDefault();
  void shutdownDiscordRPC().finally(() => {
    discordShutdownComplete = true;
    destroyTray();
    app.exit(0);
  });
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
    if (windowState.isQuitting) {
      return;
    }

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

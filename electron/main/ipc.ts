import { DiscordRPCManager } from './discord';
import { app, ipcMain } from './electron';
import { createJsonStorage } from './storage';
import { checkForUpdates, downloadAndInstallUpdate } from './updater';
import { hideMainWindow, showMainWindow, windowState } from './window';
import { setTrayEnabled } from './tray';

const discord = new DiscordRPCManager();
let lastDiscordWarningAt = 0;

export function registerIpcHandlers(): void {
  const storage = createJsonStorage(app.getPath('userData'));

  ipcMain.handle('app:get-name', () => app.getName());
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('storage:load-data', (_event, dataType: string) => storage.loadData(dataType));
  ipcMain.handle('storage:save-data', (_event, dataType: string, data: unknown) => storage.saveData(dataType, data));

  ipcMain.handle('discord:connect', () => runOptionalDiscordAction(() => discord.connect()));
  ipcMain.handle('discord:update-activity', (_event, stationName: string, tags?: string) =>
    runOptionalDiscordAction(() => discord.updateActivity(stationName, tags))
  );
  ipcMain.handle('discord:clear-activity', () => runOptionalDiscordAction(() => discord.clearActivity()));
  ipcMain.handle('discord:disconnect', () => runOptionalDiscordAction(() => discord.disconnect()));

  ipcMain.handle('window:show', () => showMainWindow());
  ipcMain.handle('window:hide', () => hideMainWindow());
  ipcMain.handle('window:set-minimize-to-tray-enabled', (_event, enabled: boolean) => {
    windowState.minimizeToTrayEnabled = enabled;
    setTrayEnabled(enabled);
  });

  ipcMain.handle('updates:check', () => checkForUpdates());
  ipcMain.handle('updates:download-and-install', () => downloadAndInstallUpdate());
}

async function runOptionalDiscordAction(action: () => Promise<void>): Promise<boolean> {
  try {
    await action();
    return true;
  } catch (error) {
    const now = Date.now();
    if (now - lastDiscordWarningAt > 60_000) {
      lastDiscordWarningAt = now;
      console.warn('Discord RPC is unavailable:', error);
    }
    return false;
  }
}

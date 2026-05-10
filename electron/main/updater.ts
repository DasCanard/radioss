import { app } from './electron';
import { windowState } from './window';

type AutoUpdater = typeof import('electron-updater')['autoUpdater'];
type ElectronUpdaterModule = typeof import('electron-updater') & {
  default?: typeof import('electron-updater');
};

let autoUpdater: AutoUpdater | null = null;

export interface UpdateCheckResult {
  available: boolean;
  currentVersion: string;
  version: string;
  body?: string;
}

export async function checkForUpdates(): Promise<UpdateCheckResult | null> {
  if (!isUpdateCheckEnabled()) {
    return null;
  }

  try {
    const updater = await getAutoUpdater();
    const result = await updater.checkForUpdates();
    const updateInfo = result?.updateInfo;
    if (!updateInfo || updateInfo.version === app.getVersion()) {
      return null;
    }

    return {
      available: true,
      currentVersion: app.getVersion(),
      version: updateInfo.version,
      body: typeof updateInfo.releaseNotes === 'string' ? updateInfo.releaseNotes : undefined
    };
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return null;
  }
}

export async function downloadAndInstallUpdate(): Promise<void> {
  const updater = await getAutoUpdater();
  await updater.downloadUpdate();
  updater.quitAndInstall(false, true);
}

async function getAutoUpdater(): Promise<AutoUpdater> {
  if (!autoUpdater) {
    const updaterModule = (await import('electron-updater')) as ElectronUpdaterModule;
    autoUpdater = updaterModule.autoUpdater ?? updaterModule.default?.autoUpdater ?? null;

    if (!autoUpdater) {
      throw new Error('electron-updater did not expose autoUpdater');
    }

    autoUpdater.autoDownload = false;
    autoUpdater.forceDevUpdateConfig = process.env.RADIOSS_FORCE_UPDATE_CHECK === 'true';
    autoUpdater.on('checking-for-update', () => console.info('Checking for updates...'));
    autoUpdater.on('update-available', (info) => console.info(`Update available: ${info.version}`));
    autoUpdater.on('update-not-available', (info) => console.info(`No update available: ${info.version}`));
    autoUpdater.on('error', (error) => console.error('Updater error:', error));
    autoUpdater.on('download-progress', (progress) => {
      windowState.mainWindow?.webContents.send('updates:progress', Math.round(progress.percent ?? 0));
    });
  }

  return autoUpdater;
}

function isUpdateCheckEnabled(): boolean {
  return app.isPackaged || process.env.RADIOSS_FORCE_UPDATE_CHECK === 'true';
}

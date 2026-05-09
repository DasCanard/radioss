import { app, Menu, nativeImage, Tray } from './electron';
import { getIconPath } from './paths';
import { showMainWindow, windowState } from './window';

let tray: Tray | null = null;

export function setTrayEnabled(enabled: boolean): void {
  if (enabled) {
    createTray();
  } else {
    destroyTray();
  }
}

export function createTray(): void {
  if (tray) {
    return;
  }

  tray = new Tray(createTrayIcon());
  tray.setToolTip('Radioss - Click to show/hide');
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Show Radioss', click: showMainWindow },
      {
        label: 'Quit',
        click: () => {
          windowState.isQuitting = true;
          app.quit();
        }
      }
    ])
  );

  tray.on('click', () => {
    const mainWindow = windowState.mainWindow;
    if (!mainWindow || mainWindow.isDestroyed()) {
      destroyTray();
      return;
    }

    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      showMainWindow();
    }
  });
  tray.on('double-click', showMainWindow);
}

export function destroyTray(): void {
  if (!tray) {
    return;
  }

  tray.destroy();
  tray = null;
}

function createTrayIcon(): Electron.NativeImage {
  const icon = nativeImage.createFromPath(getIconPath(process.platform === 'win32' ? 'radioss.ico' : 'radioss.png'));

  if (process.platform !== 'darwin') {
    return icon;
  }

  const menuBarIcon = nativeImage.createFromPath(getIconPath('trayTemplate.png'));
  menuBarIcon.setTemplateImage(true);
  return menuBarIcon;
}

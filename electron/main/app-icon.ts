import { app, nativeImage } from './electron';
import { getIconPath } from './paths';

export function setDockIcon(): void {
  if (process.platform !== 'darwin') {
    return;
  }

  const dockIcon = nativeImage.createFromPath(getIconPath('radioss.png'));
  if (!dockIcon.isEmpty()) {
    app.dock?.setIcon(dockIcon);
  }
}

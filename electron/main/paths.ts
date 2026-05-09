import { join } from 'node:path';
import { app } from './electron';

export function getIconPath(fileName: string): string {
  if (app.isPackaged) {
    return join(process.resourcesPath, 'icons', fileName);
  }

  return join(process.cwd(), 'build', 'icons', fileName);
}

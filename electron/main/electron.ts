import { createRequire } from 'node:module';

const electronRequire = createRequire(import.meta.url);

export const { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, shell } = electronRequire(
  'electron'
) as typeof import('electron');

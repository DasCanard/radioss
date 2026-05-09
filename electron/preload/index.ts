import { createRequire } from 'node:module';

const preloadRequire = createRequire(import.meta.url);
const { contextBridge, ipcRenderer } = preloadRequire('electron') as typeof import('electron');

contextBridge.exposeInMainWorld('radioss', {
  app: {
    getName: () => ipcRenderer.invoke('app:get-name'),
    getVersion: () => ipcRenderer.invoke('app:get-version')
  },
  storage: {
    loadData: (dataType: string) => ipcRenderer.invoke('storage:load-data', dataType),
    saveData: (dataType: string, data: unknown) => ipcRenderer.invoke('storage:save-data', dataType, data)
  },
  discord: {
    connect: () => ipcRenderer.invoke('discord:connect'),
    updateActivity: (stationName: string, tags?: string) =>
      ipcRenderer.invoke('discord:update-activity', stationName, tags),
    clearActivity: () => ipcRenderer.invoke('discord:clear-activity'),
    disconnect: () => ipcRenderer.invoke('discord:disconnect')
  },
  window: {
    show: () => ipcRenderer.invoke('window:show'),
    hide: () => ipcRenderer.invoke('window:hide'),
    setMinimizeToTrayEnabled: (enabled: boolean) =>
      ipcRenderer.invoke('window:set-minimize-to-tray-enabled', enabled)
  },
  updates: {
    check: () => ipcRenderer.invoke('updates:check'),
    downloadAndInstall: () => ipcRenderer.invoke('updates:download-and-install'),
    onProgress: (callback: (progress: number) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress);
      ipcRenderer.on('updates:progress', listener);
      return () => ipcRenderer.removeListener('updates:progress', listener);
    }
  }
});

export interface RadiossUpdateInfo {
  available: boolean;
  currentVersion: string;
  version: string;
  body?: string;
}

export interface RadiossApi {
  app: {
    getName(): Promise<string>;
    getVersion(): Promise<string>;
  };
  storage: {
    loadData<T>(dataType: string): Promise<T | null>;
    saveData<T>(dataType: string, data: T): Promise<void>;
  };
  discord: {
    connect(): Promise<boolean>;
    updateActivity(stationName: string, tags?: string): Promise<boolean>;
    clearActivity(): Promise<boolean>;
    disconnect(): Promise<boolean>;
  };
  window: {
    show(): Promise<void>;
    hide(): Promise<void>;
    setMinimizeToTrayEnabled(enabled: boolean): Promise<void>;
  };
  updates: {
    check(): Promise<RadiossUpdateInfo | null>;
    downloadAndInstall(): Promise<void>;
    onProgress(callback: (progress: number) => void): () => void;
  };
}

declare global {
  interface Window {
    radioss?: RadiossApi;
  }
}

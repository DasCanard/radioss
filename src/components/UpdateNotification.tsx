import React, { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, X, RefreshCw } from 'lucide-react';

interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  version: string;
  body?: string;
}

export const UpdateNotification: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(true);

  useEffect(() => {
    checkForUpdates();
  }, []);

  const checkForUpdates = async () => {
    try {
      const update = await check();
      if (update?.available) {
        setUpdateInfo({
          available: true,
          currentVersion: update.currentVersion,
          version: update.version,
          body: update.body
        });
      }
    } catch (err) {
      console.error('Failed to check for updates:', err);
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInfo) return;
    
    try {
      setDownloading(true);
      setError(null);
      
      const update = await check();
      if (!update?.available) return;

      let downloaded = 0;
      let contentLength = 0;
      
      await update.downloadAndInstall((event: any) => {
        switch (event.event) {
          case 'Started':
            contentLength = event.data.contentLength || 0;
            console.log(`Started downloading ${contentLength} bytes`);
            break;
          case 'Progress':
            downloaded += event.data.chunkLength;
            const progress = contentLength > 0 ? (downloaded / contentLength) * 100 : 0;
            setDownloadProgress(Math.round(progress));
            break;
          case 'Finished':
            console.log('Download finished');
            break;
        }
      });

      await relaunch();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update fehlgeschlagen');
      setDownloading(false);
    }
  };

  if (!updateInfo?.available || !showNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center">
          <RefreshCw className="w-5 h-5 text-blue-500 mr-2" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Update verfügbar
          </h3>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
        Version {updateInfo.version} ist verfügbar (aktuelle Version: {updateInfo.currentVersion})
      </p>

      {updateInfo.body && (
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-3 max-h-32 overflow-y-auto">
          {updateInfo.body}
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 mb-3">
          Fehler: {error}
        </div>
      )}

      {downloading ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              Download läuft...
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {downloadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${downloadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={downloadAndInstall}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Jetzt aktualisieren
        </button>
      )}
    </div>
  );
}; 
import React, { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, X, RefreshCw, ExternalLink } from 'lucide-react';

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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  useEffect(() => {
    if (updateInfo?.available) {
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [updateInfo]);

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
      setError(err instanceof Error ? err.message : 'Update failed');
      setDownloading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setShowNotification(false), 300);
  };

  if (!updateInfo?.available || !showNotification) {
    return null;
  }

  return (
    <div className={`update-notification ${isVisible ? 'visible' : ''}`}>
      <div className="update-card">
        <div className="update-header">
          <div className="update-icon">
            <RefreshCw size={20} />
          </div>
          <div className="update-content">
            <h3 className="update-title">Update available</h3>
            <p className="update-version">
              Version {updateInfo.version} is available
            </p>
          </div>
        </div>

        {updateInfo.body && (
          <a
            href={`https://github.com/DasCanard/radioss/releases/tag/v${updateInfo.version}`}
            target="_blank"
            rel="noopener noreferrer"
            className="release-notes-btn"
          >
            <ExternalLink size={14} />
            View release notes
          </a>
        )}

        {error && (
          <div className="update-error">
            {error}
          </div>
        )}

        <div className="update-actions">
          {downloading ? (
            <div className="update-progress">
              <div className="progress-info">
                <span>Downloading... {downloadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={downloadAndInstall}
                className="update-btn primary"
              >
                <Download size={16} />
                Update
              </button>
              <button
                onClick={handleClose}
                className="update-btn secondary"
              >
                Later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';


export const useMinimizeToTray = (enabled: boolean) => {
  useEffect(() => {
    const setupMinimizeToTray = async () => {
      try {
        const window = getCurrentWindow();
        
        if (enabled) {
          const unlisten = await window.onCloseRequested((event) => {
            event.preventDefault();
            invoke('hide_window').catch((error) => {
              console.error('Failed to hide window:', error);
            });
          });
          
          return unlisten;
        } else {
          return undefined;
        }
      } catch (error) {
        console.error('Failed to setup minimize to tray:', error);
        return undefined;
      }
    };

    let unlisten: (() => void) | undefined;
    
    setupMinimizeToTray().then((unlistenFn) => {
      unlisten = unlistenFn;
    });

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [enabled]);
}; 
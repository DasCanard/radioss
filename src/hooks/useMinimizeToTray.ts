import { useEffect } from 'react';

export const useMinimizeToTray = (enabled: boolean) => {
  useEffect(() => {
    const setMinimizeToTray = async () => {
      try {
        await window.radioss?.window.setMinimizeToTrayEnabled(enabled);
      } catch (error) {
        console.error('Failed to setup minimize to tray:', error);
      }
    };

    void setMinimizeToTray();

    return () => {
      void window.radioss?.window.setMinimizeToTrayEnabled(false);
    };
  }, [enabled]);
};

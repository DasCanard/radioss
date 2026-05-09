import { useEffect } from 'react';

export const useLoadingScreen = () => {
  useEffect(() => {
    let appReady = false;
    let minTimeElapsed = false;

    const isElectron = typeof window !== 'undefined' && Boolean(window.radioss);

    const hideLoadingScreen = () => {
      if (appReady && minTimeElapsed) {
        document.body.classList.add('app-loaded');
        
        const loadingElement = document.getElementById('app-loading');
        if (loadingElement) {
          loadingElement.remove();
        }
      }
    };

    const minTimer = setTimeout(() => {
      minTimeElapsed = true;
      hideLoadingScreen();
    }, 300);

    if (isElectron && window.radioss) {
      window.radioss.app.getName()
        .then(() => {
          appReady = true;
          hideLoadingScreen();
        })
        .catch(() => {
          appReady = true;
          hideLoadingScreen();
        });
    } else {
      appReady = true;
      hideLoadingScreen();
    }

    return () => {
      clearTimeout(minTimer);
    };
  }, []);
};

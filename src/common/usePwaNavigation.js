import { useState, useEffect } from 'react';
import { pwaHistory } from '../utils/pwaHistoryManager';

export function usePwaNavigation(currentUser) {
  const [navState, setNavState] = useState(() => ({
    canGoBack: pwaHistory.canGoBack(),
    canGoForward: pwaHistory.canGoForward(),
    previousRoute: pwaHistory.getPreviousRoute(),
    nextRoute: pwaHistory.getNextRoute(),
    currentRoute: pwaHistory.getCurrentRoute(),
    isStandalone: pwaHistory.isStandalonePwa(),
    currentIndex: pwaHistory.currentIndex,
    stackLength: pwaHistory.stack.length
  }));

  useEffect(() => {
    const update = () => {
      setNavState({
        canGoBack: pwaHistory.canGoBack(),
        canGoForward: pwaHistory.canGoForward(),
        previousRoute: pwaHistory.getPreviousRoute(),
        nextRoute: pwaHistory.getNextRoute(),
        currentRoute: pwaHistory.getCurrentRoute(),
        isStandalone: pwaHistory.isStandalonePwa(),
        currentIndex: pwaHistory.currentIndex,
        stackLength: pwaHistory.stack.length
      });
    };

    const unsubscribe = pwaHistory.subscribe(update);
    window.addEventListener('fcc-pwa-nav-change', update);
    window.addEventListener('hashchange', update);

    return () => {
      unsubscribe();
      window.removeEventListener('fcc-pwa-nav-change', update);
      window.removeEventListener('hashchange', update);
    };
  }, []);

  return {
    ...navState,
    goBack: (fallback) => pwaHistory.goBack(fallback),
    goForward: () => pwaHistory.goForward(),
    reload: () => pwaHistory.reload(),
    goHome: () => pwaHistory.goHome(currentUser)
  };
}

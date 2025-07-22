
import { useState, useCallback } from 'react';

export const useSplashScreen = () => {
  const [isSplashScreenVisible, setIsSplashScreenVisible] = useState(true);

  const hideSplashScreen = useCallback(() => {
    setIsSplashScreenVisible(false);
  }, []);

  const showSplashScreen = useCallback(() => {
    setIsSplashScreenVisible(true);
  }, []);

  return {
    isSplashScreenVisible,
    hideSplashScreen,
    showSplashScreen
  };
};
